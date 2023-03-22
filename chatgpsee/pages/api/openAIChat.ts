import type { NextApiRequest, NextApiResponse } from "next"
// import { Configuration, OpenAIApi } from "openai"
import { ChatVectorDBQAChain, LLMChain } from "langchain/chains";
import { OpenAI } from "langchain/llms";
import { PDFLoader } from "langchain/document_loaders";
import { Document } from "langchain/docstore";
import { TokenTextSplitter } from "langchain/text_splitter";
import { Chroma } from "langchain/vectorstores";
import { OpenAIEmbeddings } from "langchain/embeddings";
// const { JSDOM } = require("jsdom")
// global.DOMParser = new JSDOM().window.DOMParser
var xml2js = require('xml2js')
var parseString = xml2js.parseString
var parser = new xml2js.Parser()
function parseXml(xml: string) {
    return new Promise((resolve, reject) => {
        parser.parseString(xml, (err: any, result: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}


let CHUNK_SIZE = 200
let CHUNK_OVERLAP = 30
let NUM_CHUNKS = 10


// const configuration = new Configuration({
//     apiKey: process.env.OPENAI_API_KEY,
// })
// const openai = new OpenAIApi(configuration)

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    console.log("req.body", req.body.messages)
    // our stuff goes here
    // req.body.input
    // req.body.num_articles

    let [docs, pmids] = await get_abstracts_from_query(req.body.input, req.body.num_articles)
    // docs = await split_docs(docs)
    let embeddings = new OpenAIEmbeddings()

    let vectorstore = new Chroma(embeddings, { collectionName: "pubmed-docs" })

    // let vectorstore = await Chroma.fromDocuments(docs_split, embeddings, {
    //     collectionName: "pubmed-docs",
    // })
    vectorstore.addDocuments(docs)
    // console.log(docs)
    await new Promise(f => setTimeout(f, 1000));

    let chain = await ChatVectorDBQAChain.fromLLM(
        new OpenAI({}),
        vectorstore,
        {
            returnSourceDocuments: true,
            k: NUM_CHUNKS,
        }
    )

    const completion = await chain.call({ question: req.body.question, chat_history: req.body.messages })

    // const completion = await openai.createChatCompletion({
    //     model: "gpt-3.5-turbo",
    //     messages: req.body.messages,
    // })

    res.status(200).json({ result: completion })
}

async function split_docs(docs: Document[], chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP) {
    const splitter = new TokenTextSplitter({
        encodingName: "gpt2",
        chunkSize: chunk_size,
        chunkOverlap: chunk_overlap,
      });
    const docs_split = splitter.splitDocuments(docs)
    return docs_split
}

async function get_pubmed_results(query: string, num_results:number=30, oa:boolean=false) {
    let req_url = null
    if (oa) {
        req_url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&sort=relevance&retmax=${num_results}&term=(pubmed%20pmc%20open%20access[filter])+${query}`
    }
    else {
        req_url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&sort=relevance&retmax=${num_results}&term=${query}`
    }
    const req = await fetch(req_url)
    const json = await req.json()
    const pmids = json.esearchresult.idlist
    return pmids
}

async function get_docs_from_query(query: string, num_results:number=30) {
    const pmids = await get_pubmed_results(query, num_results, true)
    let docs = []
    for (let pmid of pmids) {
        let article_docs = await get_docs_from_pmid(pmid)
        if (article_docs && article_docs.length > 0)
            docs.push(...article_docs)
    }
    return [docs, pmids]
}

async function get_abstracts_from_query(query: string, num_results:number=30) {
    const pmids = await get_pubmed_results(query, num_results=num_results)
    const docs = await get_abstracts_from_pmids(pmids)
    return [docs, pmids]
}

async function get_abstracts_from_pmids(pmids: string[]) {
    let req_url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(",")}&rettype=abstract`
    let xml_response = await fetch(req_url)
    let xml_text = await xml_response.text()
    // let data = new DOMParser().parseFromString(xml_text, "text/xml")
    let data : any = await parseXml(xml_text)
    let articles = data.PubmedArticleSet.PubmedArticle
    console.log(articles[6].MedlineCitation[0].Article[0].Abstract[0].AbstractText[0])
    
    let docs = []
    if (articles) {
        for (let article of articles as any) {
            if (!article.MedlineCitation[0].Article[0].hasOwnProperty("Abstract")) {
                console.log("Skipping article without abstract.")
                continue
            }
            let abstract = article.MedlineCitation[0].Article[0].Abstract[0].AbstractText[0]
            if (typeof abstract === "object") abstract = abstract._
            const author = article.MedlineCitation[0].Article[0].AuthorList[0].Author[0].LastName[0]
            const pmid = article.MedlineCitation[0].PMID[0]._
            const year = article.MedlineCitation[0].DateCompleted[0].Year[0]
            const citation = `(${author} ${year} - ${pmid})`
            console.log(`${citation}: ${abstract.length} characters`)
            const doc = new Document({ pageContent: abstract,
                                        metadata: { 
                                            "pmid": pmid,
                                            "citation": citation
                                        }
                                    })
            docs.push(doc)
        }
    }
    console.log(`${docs.length} docs parsed across ${articles.length} articles.`)
    return docs
}

async function get_docs_from_pmid(pmid: string) {
    let req_url = `https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi/BioC_json/${pmid}/unicode`
    let docs = null
    const doc_req = await fetch(req_url)
    try {
        // make GET request to req_url in typescript
        const doc = await doc_req.text()
        console.log(pmid)
        console.log(doc)
        docs = parse_pubmed_json(doc, pmid)
    }
    catch(e) {
        const doc_text = await doc_req.text()
        console.log(`Error with article ${pmid}: ${doc_text}`)
    }
    return docs
}

async function parse_pubmed_json(doc_json: any, pmid: string) {
    let docs = []
    let lead_author = doc_json.documents[0].passages[0].infons.name_0.split(";")[0].substring(8)
    let year = doc_json.date.substring(0, 4)
    for (let passage of doc_json.passages) {
        let section_type = passage.infons.section_type.toLowerCase()
        let doc_type = passage.infons.type.toLowerCase()
        let citation = `(${lead_author} ${year} - ${pmid})`
        let doc = new Document({ pageContent: passage.text,
                                    metadata: { 
                                        "offset": passage.offset, 
                                        "pmid": pmid,
                                        "section_type": section_type,
                                        "type": doc_type,
                                        "source": citation
                                    }
                                })
        docs.push(doc)
    }
    return docs
}

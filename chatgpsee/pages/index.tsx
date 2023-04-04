import React, { useRef } from "react"
import FloatingBanner from './FloatingBanner';
import Tooltip from './Tooltip';
import QueryInfo from './QueryInfo';
import ModeButtons from './ModeButtons';
import CopyIcon from './CopyIcon';
import SocialMetaTags from './SocialMetaTags';
import RangeSlider from "react-range-slider-input";
import 'react-range-slider-input/dist/style.css';
import { useRouter } from 'next/router';
// https://www.brilliantly.ai/blog/sightbot

interface Conversation {
    role: string
    content: string
    sources: string[]
    pubMedQuery: string
    bibtex: string
}
  

export default function Home() {
    // States
    const [value, setValue] = React.useState<string>("")
    const [conversation, setConversation] = React.useState<Conversation[]>([])
    const [OpenAIAPIKey, setOpenAIAPIKey] = React.useState<string>("")
    const [isLoading, setIsLoading] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [years, setYears] = React.useState([1900, 2023]);

    // advanced search
    const [isAdvancedVisible, setIsAdvancedVisible] = React.useState<boolean>(false);
    const [mode, setMode] = React.useState<string>('abstracts');
    const [pubMedQuery, setPubMedQuery] = React.useState<string>('');

    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const openai_api_key = router.query['key']
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => {
        if (openai_api_key) {
            if (Array.isArray(openai_api_key)) {
                setOpenAIAPIKey(openai_api_key[0])
            } else {
                setOpenAIAPIKey(openai_api_key)
            }
        }
      }, [openai_api_key]);

    const toggleAdvancedVisibility = () => {
        setIsAdvancedVisible(!isAdvancedVisible);
    };

    const handleOpenAIAPIKeyInput = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setOpenAIAPIKey(e.target.value)
            const updatedQuery = {
                ...router.query,
                key: e.target.value,
            }
            router.replace(
                {
                    pathname: router.pathname,
                    query: updatedQuery,
                },
                undefined,
                { shallow: true }
            )  
        },
        []
    )


    const handleInput = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setValue(e.target.value)
        },
        []
    )

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleEnter()
        }
    }

    const handleModeChange = (mode: string) => {
        setMode(mode);
    };

    const handlePubMedQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPubMedQuery(e.target.value);
    };

    const handleEnter = async() => {
        setErrorMessage(null);
        if (OpenAIAPIKey === "") {
            setErrorMessage("Please enter an OpenAI API key. For a limited time, use the key \"TryBrilliantly\" for free!")
            return
        }
        try {
            setIsLoading(true);
            inputRef.current?.focus()
            const response = await fetch("https://gpsee-server.brilliantly.ai/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ messages: conversation,
                                        question: value,
                                        openai_api_key: OpenAIAPIKey,
                                        years: years,
                                        search_mode: mode,
                                        pubmed_query: pubMedQuery}),
            })
            if (!response.ok) {
                setIsLoading(false);
                const errorData = await response.json();
                // Set a custom error message or use the one from the response
                setErrorMessage(`An error occurred during the request: ${errorData.message}`);
                return;
            }

            // Clear the error message if the request is successful
            setErrorMessage(null);

            const data = await response.json()
            setValue("")
            setIsLoading(false);
            setConversation([
                ...conversation,
                { role: "user", content: value , sources: [], pubMedQuery: data.pubmed_query , bibtex: "" },
                { role: "assistant", content: data.answer , sources: data.citations, pubMedQuery: "" , bibtex: data.bibtex },
            ])
            setPubMedQuery('')
        } catch (error: any) {
            setErrorMessage(`An error occurred during the request: ${error.message}`);
        }
    }

    const handleRefresh = () => {
        inputRef.current?.focus()
        setValue("")
        setConversation([])
    }

    function displayTextWithNewlines(text: string) {
        return text.split('\n').map((line, index) => (
            <React.Fragment key={index}>
                {line}
                <br />
            </React.Fragment>
        ));
    }

    return (
        <div className='w-full'>
            <SocialMetaTags
                title="SightBot: A Conversational AI for Biomedical Research"
                description="Made with love and AI by Brilliantly."
                url="https://www.brilliantly.ai/blog/sightbot"
                imageUrl="https://api.typedream.com/v0/document/public/1f5b4d3b-6aea-4b9d-8a5a-15bdc5c763be/2Nx4BozJ2grE79sVLnprWDJJjHQ_SightBotBlogImage.jpeg"
            />
            {errorMessage && <FloatingBanner message={errorMessage} />}
            <div className='flex flex-col items-center justify-center mt-40 text-center'>
                <h1 className='text-6xl'>Welcome to SightBot.</h1>
                <h3 className='blog-promo'>Learn more about how this works and what else Brilliantly offers <a href="https://brilliantly.ai/blog/sightbot/" target="_blank" rel="noopener noreferrer">here</a>!</h3>
                <div className='my-10'>
                    <input
                        placeholder='OpenAI API Key'
                        value={OpenAIAPIKey}
                        className='max-w-s input input-bordered input-accent'
                        onChange={handleOpenAIAPIKeyInput}
                    />
                    <Tooltip
                        content={
                            <>
                            Generate yours{' '}
                            <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer">
                                here
                            </a>!
                            </>
                        }
                    />
                </div>

                <div className='textarea'>
                    {conversation.map((item, index) => (
                        <React.Fragment key={index}>
                            <br />
                            {item.role === "assistant" ? (
                                <div className='chat chat-start'>
                                    <div className='chat-bubble chat-bubble-base-100 text-2xl'>
                                        {displayTextWithNewlines(item.content)}
                                        {item.sources && (
                                            <div>
                                                Sources: {item.sources.map((source, sourceIndex, sourcesArray) => (
                                                    <React.Fragment key={sourceIndex}>
                                                        <a className="source-link" href={`https://pubmed.ncbi.nlm.nih.gov/${source}/`} target="_blank" rel="noopener noreferrer">
                                                            {source}
                                                        </a>
                                                        {sourceIndex !== sourcesArray.length - 1 && ', '}
                                                    </React.Fragment>
                                                ))}
                                                <br/>
                                                <CopyIcon textToCopy={item.bibtex} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className='chat chat-end'>
                                    <div className='chat-bubble chat-bubble-accent text-2xl'>
                                        {displayTextWithNewlines(item.content)}
                                        <QueryInfo query={item.pubMedQuery} />
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                    {isLoading &&
                        <React.Fragment>
                                <br />
                                <div className='chat chat-end'>
                                    <div className='chat-bubble chat-bubble-accent text-2xl'>
                                        {value}
                                    </div>
                                </div>
                                <div className='chat chat-start'>
                                    <div className='chat-bubble chat-bubble-base-100 text-2xl'>
                                        Loading...
                                    </div>
                                </div>
                        </React.Fragment>}

                </div>

            </div>
            <div>
            <div className='flex flex-col items-center justify-center text-center'>

            {/* <p className='mb-3 text-2xl font-bold items-centered'>Enter a question for ChatGPSee:</p> */}
            <div className="input-container">
                <input
                    placeholder='What are some treatments for DME?'
                    className='w-1/2 max-w-l items-centered justify-center input input-bordered input-accent mb-3 text-2xl'
                    value={value}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className='btn btn-outline btn-success mb-5 '
                    onClick={handleEnter}
                    title="Send message"
                >
                    <i className="fa fa-paper-plane" aria-hidden="true"></i>
                </button>
            </div>
            <div className="advanced-search">
                {/* Advanced search */}
                <button type="button" className="advanced-button" onClick={toggleAdvancedVisibility}>
                    Advanced
                </button>
                {isAdvancedVisible && (
                    <div>
                        <br/>
                        <RangeSlider min="1900" max="2023" value={years} onInput={setYears} />
                        <p style={{padding: "0.5em"}}> Answer based on articles published from {years[0]} - {years[1]}. </p>
                        <br/>
                        <ModeButtons mode={mode} onModeChange={handleModeChange}/>
                        <br/>
                        <input
                            type="text"
                            placeholder='PubMed search term'
                            className='max-w-s input input-bordered input-accent'
                            id="pubmed-query"
                            name="pubmed-query"
                            onKeyDown={handleKeyDown}
                            onChange={handlePubMedQueryChange} />
                        <Tooltip
                            content={
                                <>
                                Enter a search term that will be used to find relevant articles.
                                </>
                            }
                        />
                    </div>
                )}
                
            </div>
            <div className="flex flex-col space-y-5 ...">
                <div>
                    <button

                        className='btn btn-outline btn-warning mb-5'
                        onClick={handleRefresh}
                        title="Clear conversation"
                    >
                        Clear <i style={{padding: "0.5em"}} className="fa fa-trash" aria-hidden="true"></i>
                    </button>
                    </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

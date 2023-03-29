import React, { useRef } from "react"
import FloatingBanner from './FloatingBanner';
import { useRouter } from 'next/router';

interface Conversation {
    role: string
    content: string
    sources: string[]
}

export default function Home() {
    // States
    const [value, setValue] = React.useState<string>("")
    const [conversation, setConversation] = React.useState<Conversation[]>([])
    const [OpenAIAPIKey, setOpenAIAPIKey] = React.useState<string>("")
    const [isLoading, setIsLoading] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const openai_api_key = router.query['openai_api_key']
    
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


    const handleOpenAIAPIKeyInput = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setOpenAIAPIKey(e.target.value)
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

    const handleEnter = async() => {
        try {
            setIsLoading(true);
            inputRef.current?.focus()
            const response = await fetch("https://gpsee-server.brilliantly.ai/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ messages: conversation, question: value, openai_api_key: OpenAIAPIKey }),
            })

            if (!response.ok) {
                const errorData = await response.json();
                // Set a custom error message or use the one from the response
                setErrorMessage('An error occurred during the request. Please refresh the page.');
                return;
            }

            // Clear the error message if the request is successful
            setErrorMessage(null);

            const data = await response.json()
            setValue("")
            setIsLoading(false);
            setConversation([
                ...conversation,
                { role: "user", content: value , sources: [] },
                { role: "assistant", content: data.answer , sources: data.citations },
            ])
        } catch (error) {
            setErrorMessage('An error occurred during the request. Please refresh the page.');
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
            {errorMessage && <FloatingBanner message={errorMessage} />}
            <div className='flex flex-col items-center justify-center mt-40 text-center'>
                <h1 className='text-6xl'>Welcome to ChatGPSee, a PubMed chatbot.</h1>
                <div className='my-12'>
                    <input
                        placeholder='OpenAI API Key'
                        value={OpenAIAPIKey}
                        className='w-full max-w-xs input input-bordered input-accent mb-10'
                        onChange={handleOpenAIAPIKeyInput}
                    />

                    <p className='mb-3 text-2xl font-bold'>Enter a question for ChatGPSee:</p>
                    <input
                        placeholder='What are some treatments for DME?'
                        className='w-full max-w-s input input-bordered input-accent mb-3'
                        value={value}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="flex flex-col space-y-5 ...">
                        <div>
                        <button
                            className='btn btn-outline btn-success mb-5 '
                            onClick={handleEnter}
                        >
                            Enter
                        </button>
                        </div>

                        <div>
                        <button
                        
                            className='btn btn-outline btn-warning mb-5'
                            onClick={handleRefresh}
                        >
                            Start New Conversation
                        </button>
                        </div>
                    </div>
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
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className='chat chat-end'>
                                    <div className='chat-bubble chat-bubble-accent text-2xl'>
                                        {displayTextWithNewlines(item.content)}
                                        {item.sources && (
                                            <div>
                                                {item.sources.map((source, sourceIndex, sourcesArray) => (
                                                    <React.Fragment key={sourceIndex}>
                                                        <a href={`https://example.com?source=${source}`} target="_blank" rel="noopener noreferrer">
                                                            {source}
                                                        </a>
                                                        {sourceIndex !== sourcesArray.length - 1 && ', '}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        )}
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
        </div>
    )
}

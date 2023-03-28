import React, { useRef } from "react"

interface Conversation {
    role: string
    content: string
}

export default function Home() {
    // States
    const [value, setValue] = React.useState<string>("")
    const [conversation, setConversation] = React.useState<Conversation[]>([])
    const [OpenAIAPIKey, setOpenAIAPIKey] = React.useState<string>("")
    const [isLoading, setIsLoading] = React.useState(false);
    const inputRef = useRef<HTMLInputElement>(null)


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
        setIsLoading(true);
        inputRef.current?.focus()
        const response = await fetch("https://gpsee-server.brilliantly.ai/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ messages: conversation, question: value, openai_api_key: OpenAIAPIKey }),
        })

        const data = await response.json()
        setValue("")
        setIsLoading(false);
        setConversation([
            ...conversation,
            { role: "user", content: value },
            { role: "assistant", content: data.answer },
        ])
    }



    const handleRefresh = () => {
        inputRef.current?.focus()
        setValue("")
        setConversation([])
    }

    return (
        <div className='w-full'>
            <div className='flex flex-col items-center justify-center mt-40 text-center'>
                <h1 className='text-6xl'>Welcome to ChatGPSee</h1>
                <div className='my-12'>
                    Enter your OpenAI API Key: <input
                        placeholder='OpenAI API Key'
                        className='w-full max-w-xs input input-bordered input-accent mb-10'
                        onChange={handleOpenAIAPIKeyInput}
                    />

                    <p className='mb-3 text-2xl font-bold'>Insert your question here:</p>
                    <input
                        placeholder='Question'
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
                                        {item.content}
                                    </div>
                                </div>
                            ) : (
                                <div className='chat chat-end'>
                                        <div className='chat-bubble chat-bubble-accent text-2xl'>
                                        {item.content}
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

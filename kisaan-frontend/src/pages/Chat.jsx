import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Mic, Send, Bot, MicOff, Loader2, Camera, Globe } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Chat() {
    const { addChat, addPoints, user, setUser, token, getChatsForUser } = useStore();
    const [input, setInput]               = useState('');
    const [isListening, setIsListening]   = useState(false);
    const [isLoading, setIsLoading]       = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile]       = useState(null);

    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef   = useRef(null);

    const userId = user?._id || user?.id;
    const chats  = getChatsForUser(userId);

    const getAuthHeaders = (includeJson = false) => {
        const headers = {};

        if (includeJson) {
            headers['Content-Type'] = 'application/json';
        }

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return headers;
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chats, isLoading]);

    const handleLanguageChange = async (e) => {
        const newLang = e.target.value;
        try {
            const res = await fetch(`${API_URL}/api/users/${userId}`, {
                method:  'PUT',
                headers: getAuthHeaders(true),
                body:    JSON.stringify({ language: newLang })
            });

            if (res.ok) {
                setUser({ ...user, language: newLang });
                addChat(userId, {
                    id:    Date.now(),
                    text:  `Language changed to ${newLang}. I will reply in this language now!`,
                    isBot: true
                });
            } else {
                alert('Failed to update language');
            }
        } catch (err) {
            console.error('Error updating language:', err);
        }
    };

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('SpeechRecognition not supported in this browser.');
            return;
        }

        const recognition          = new SpeechRecognition();
        recognition.continuous     = false;
        recognition.interimResults = true;
        recognition.lang           = 'en-IN';

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            setInput(transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech error:', event.error);
            setIsListening(false);
        };

        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;

        return () => recognitionRef.current?.abort();
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Voice input not supported. Please use Chrome or Edge.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setInput('');
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error('Failed to start recognition:', err);
                setIsListening(false);
            }
        }
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        const userText = input.trim();
        if ((!userText && !imageFile) || isLoading || !userId) return;

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        }

        setInput('');

        addChat(userId, {
            id:           Date.now(),
            text:         userText || 'Uploaded an image for analysis.',
            isBot:        false,
            isImage:      !!imageFile,
            imagePreview: imageFile ? imagePreview : null
        });

        setIsLoading(true);

        try {
            if (imageFile) {
                const formData = new FormData();
                formData.append('user_id', userId);
                formData.append('image', imageFile);

                const response = await fetch(`${API_URL}/api/upload-image`, {
                    method:  'POST',
                    headers: getAuthHeaders(),
                    body:    formData
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || `Server error: ${response.status}`);
                }

                const data = await response.json();
                addChat(userId, {
                    id:    Date.now() + 1,
                    text:  `Detected: ${data.diseasePredicted} (${data.confidence} confidence)\n\nTreatment: ${data.treatment}`,
                    isBot: true
                });

                if (data.points_earned) addPoints(data.points_earned);
            } else {
                const response = await fetch(`${API_URL}/api/chat`, {
                    method:  'POST',
                    headers: getAuthHeaders(true),
                    body:    JSON.stringify({ user_id: userId, message: userText })
                });

                if (!response.ok) throw new Error(`Server error: ${response.status}`);

                const data = await response.json();
                addChat(userId, { id: Date.now() + 1, text: data.reply, isBot: true });
                if (data.points_earned) addPoints(data.points_earned);
            }
        } catch (error) {
            console.error('Chat API Error:', error);
            addChat(userId, {
                id:    Date.now() + 1,
                text:  'Connection error. Please make sure the backend server is running.',
                isBot: true
            });
        } finally {
            setIsLoading(false);
            setImageFile(null);
            setImagePreview(null);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            <header className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between shrink-0">
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-kisaan-100 flex items-center justify-center mr-3">
                        <Bot className="text-kisaan-600" size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 dark:text-white">Kisaan Konnect AI</h1>
                        <p className="text-xs text-green-600 font-medium tracking-wide">Online</p>
                    </div>
                </div>

                <div className="flex items-center bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-600">
                    <Globe size={14} className="text-gray-500 mr-2" />
                    <select
                        value={user?.language || 'English'}
                        onChange={handleLanguageChange}
                        className="bg-transparent text-xs font-medium text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                    >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Marathi">Marathi</option>
                        <option value="Telugu">Telugu</option>
                        <option value="Tamil">Tamil</option>
                        <option value="Gujarati">Gujarati</option>
                        <option value="Punjabi">Punjabi</option>
                        <option value="Kannada">Kannada</option>
                    </select>
                </div>
            </header>

            <div className="flex-grow overflow-y-auto p-4 space-y-4 scroll-smooth">
                {chats.length === 0 && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-70">
                        <Bot size={56} className="mb-3 text-gray-400" />
                        <p className="font-medium">Ask me about crops, weather, or pests!</p>
                        <p className="text-xs mt-1">Tap the mic to use voice</p>
                    </div>
                )}

                {chats.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm flex flex-col ${
                            msg.isBot
                                ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-sm'
                                : 'bg-kisaan-600 text-white rounded-tr-sm'
                        }`}>
                            {msg.isImage && msg.imagePreview && (
                                <img src={msg.imagePreview} alt="Upload" className="w-full max-w-[200px] rounded-xl mb-2 border border-white/20 shadow-sm" />
                            )}
                            <span className="whitespace-pre-wrap">{msg.text}</span>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 text-gray-500 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm p-3 text-sm flex items-center shadow-sm">
                            <Loader2 className="animate-spin text-kisaan-600 mr-2" size={16} />
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0">
                {imagePreview && (
                    <div className="mb-3 relative inline-block">
                        <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-xl border-2 border-kisaan-500 shadow-sm" />
                        <button
                            onClick={() => { setImagePreview(null); setImageFile(null); }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                        >&times;</button>
                    </div>
                )}

                <form onSubmit={handleSend} className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleListening}
                        disabled={isLoading}
                        className={`p-3 rounded-full transition-all flex-shrink-0 disabled:opacity-50 ${
                            isListening
                                ? 'bg-red-500 text-white shadow-lg animate-pulse ring-4 ring-red-500/30'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                    >
                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>

                    <div className="relative flex-grow">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                            className={`w-full p-3 pr-10 rounded-full bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-kisaan-500 text-sm outline-none disabled:opacity-50 ${
                                isListening ? 'ring-2 ring-red-400 placeholder-red-400' : ''
                            }`}
                            placeholder={
                                imagePreview ? 'Add a description...'
                                : isListening ? 'Listening...'
                                : 'Type or upload photo...'
                            }
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-kisaan-600 disabled:opacity-50"
                        >
                            <Camera size={18} />
                        </button>
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
                    </div>

                    <button
                        type="submit"
                        disabled={(!input.trim() && !imageFile) || isLoading}
                        className="p-3 rounded-full bg-kisaan-600 hover:bg-kisaan-700 text-white flex-shrink-0 disabled:opacity-50 transition-colors shadow-sm disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                </form>
            </div>
        </div>
    );
}

import React, { useState, useEffect, useRef } from 'react';

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    // رسائل وهمية للتصميم
    const [messages, setMessages] = useState([
        { text: "أهلاً بك في Dine Advisor! 🍽️ كيف يمكنني مساعدتك في اختيار مطعمك اليوم؟", sender: 'bot' },
    ]);

    // وظيفة للنزول لآخر رسالة تلقائياً
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const newMessages = [...messages, { text: inputValue, sender: 'user' }];
        setMessages(newMessages);
        setInputValue('');

        // محاكاة رد البوت
        setTimeout(() => {
            setMessages(prev => [...prev, { text: "أنا هنا لمساعدتك! هذا الرد تجريبي حتى يتم ربط الـ API الخاص بي بالذكاء الاصطناعي. 🤖", sender: 'bot' }]);
        }, 1000);
    };

    // CSS مخصص للهوية والحركات
    const customStyles = `
        .chat-floating-btn {
            background: linear-gradient(135deg, #fd7e14 0%, #ff4d4d 100%);
            border: none;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .chat-floating-btn:hover {
            transform: scale(1.1) rotate(10deg);
            box-shadow: 0 10px 20px rgba(253, 126, 20, 0.4) !important;
        }
        .bot-bubble {
            background-color: #ffffff;
            border-bottom-left-radius: 2px !important;
            color: #333;
        }
        .user-bubble {
            background: linear-gradient(135deg, #fd7e14 0%, #ff4d4d 100%);
            border-bottom-right-radius: 2px !important;
            color: white;
        }
        .online-dot {
            width: 10px;
            height: 10px;
            background-color: #2ecc71;
            border-radius: 50%;
            display: inline-block;
            margin-right: 5px;
            box-shadow: 0 0 8px #2ecc71;
        }
        .chat-window {
            width: 350px;
            height: 500px;
            bottom: 100px;
            right: 25px;
            animation: slideIn 0.4s ease-out;
        }
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;

    return (
        <>
            <style>{customStyles}</style>

            {/* زر فتح الشات العائم */}
            <button 
                className="btn chat-floating-btn rounded-circle shadow-lg d-flex align-items-center justify-content-center"
                style={{ position: 'fixed', bottom: '25px', right: '25px', width: '65px', height: '65px', zIndex: 1000 }}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <i className="bi bi-x-lg text-white fs-3"></i>
                ) : (
                    <i className="bi bi-robot text-white fs-2"></i>
                )}
            </button>

            {/* نافذة الشات */}
            {isOpen && (
                <div className="card shadow-lg border-0 rounded-4 chat-window position-fixed d-flex flex-column" style={{ zIndex: 1000 }}>
                    
                    {/* رأس الشات (Header) */}
                    <div className="card-header border-0 rounded-top-4 py-3" style={{ background: '#212529', color: 'white' }}>
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                                <div className="position-relative">
                                    <div className="bg-warning rounded-circle p-2 me-2">
                                        <i className="bi bi-robot text-dark fs-5"></i>
                                    </div>
                                    <span className="online-dot position-absolute" style={{ bottom: '0', right: '8px' }}></span>
                                </div>
                                <div>
                                    <h6 className="mb-0 fw-bold">مساعد Dine Advisor</h6>
                                    <small style={{ fontSize: '10px', color: '#bbb' }}>متصل الآن</small>
                                </div>
                            </div>
                            <button className="btn btn-sm text-white-50 p-0" onClick={() => setIsOpen(false)}>
                                <i className="bi bi-dash-lg"></i>
                            </button>
                        </div>
                    </div>

                    {/* منطقة الرسائل */}
                    <div className="card-body overflow-auto p-3" style={{ flex: 1, backgroundColor: '#f0f2f5' }}>
                        {messages.map((msg, index) => (
                            <div key={index} className={`d-flex mb-3 ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                                <div className={`p-3 shadow-sm rounded-4 ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`} 
                                     style={{ maxWidth: '85%', fontSize: '14px', lineHeight: '1.5' }}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* إدخال الرسائل */}
                    <form className="card-footer bg-white border-0 p-3" onSubmit={handleSend}>
                        <div className="input-group bg-light rounded-pill px-2">
                            <input 
                                type="text" 
                                className="form-control border-0 bg-transparent py-2" 
                                placeholder="اكتب سؤالك هنا..." 
                                style={{ boxShadow: 'none' }}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                            />
                            <button className="btn text-warning" type="submit">
                                <i className="bi bi-send-fill fs-5"></i>
                            </button>
                        </div>
                        <div className="text-center mt-2">
                            <small className="text-muted" style={{ fontSize: '10px' }}>بواسطة Dine Advisor AI</small>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
}
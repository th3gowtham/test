import logoImg from "../assets/1.png";
import { useState, useEffect } from 'react';

// import img2r from "../assets/2r.png";
const WelcomeScreen = () => {
  const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth <= 768);
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);
  return (
    <>
    {isMobile ? <br/>: ""}
    
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
       
        padding: "1.5rem", // px-6
        minHeight: isMobile ? " " : "calc(100vh - 4rem)", // Full height for small screens
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          textAlign: "center",
          width: "100%",
          maxWidth: "320px", // max-w-sm
          margin: "0 auto",
        }}
      >
        <div style={{
          marginTop: "50px"
        }
        }>
          <img
            src={logoImg}
            alt="Logo"
            style={{
              width: "170px",
              height: "170px",
              objectFit: "contain",
              marginTop: "80px",
              marginBottom: "20px"
              
            }}
          />
        </div>

        <h1
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "#111827",
            marginBottom: "0.5rem",
           
          }}
        >
          Welcome to HoneyBee Chat
        </h1>

        <p
          style={{
            fontSize: "0.875rem",
            color: "#4b5563",
            lineHeight: "1.5rem",
           
          }}
        >
          {isMobile ? "Choose a chat on the bottom to begin chatting." : "Choose a chat on the left to begin chatting." }
        </p>
      </div>
    </div>
    </>
  );
};

export default WelcomeScreen;

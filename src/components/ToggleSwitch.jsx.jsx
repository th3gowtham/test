import React from "react";

function ToggleSwitch({ label, isOn, onToggle, isDisabled }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column", // for small screens
        gap: "0.5rem", // gap-2
        alignItems: "flex-start", // items-start
        justifyContent: "space-between",
        width: "100%",
        maxWidth: "24rem", // max-w-sm
        marginBottom: "1rem", // mb-4
      }}
    >
      {/* ✅ Responsive label */}
      <span
        style={{
          fontSize: "0.875rem", // text-sm
          color: "#1f2937", // text-gray-800
        }}
      >
        {label}
      </span>

      <button
        onClick={onToggle}
        disabled={isDisabled}
        role="switch"
        aria-checked={isOn}
        style={{
          width: "3rem", // w-12
          height: "1.5rem", // h-6
          borderRadius: "9999px", // rounded-full
          padding: "0.25rem", // p-1
          display: "flex",
          alignItems: "center",
          backgroundColor: isOn ? "#14b8a6" : "#9ca3af", // bg-teal-500 / bg-gray-400
          transition: "background-color 0.3s ease",
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: isDisabled ? 0.5 : 1,
          outline: "none",
        }}
      >
        <div
          style={{
            width: "1.25rem", // w-5
            height: "1.25rem", // h-5
            backgroundColor: "#ffffff", // bg-white
            borderRadius: "9999px", // rounded-full
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.25)", // shadow-md
            transform: isOn ? "translateX(1.5rem)" : "translateX(0)", // translate-x-6 / translate-x-0
            transition: "transform 0.3s ease",
          }}
        ></div>
      </button>
    </div>
  );
}

export default ToggleSwitch;

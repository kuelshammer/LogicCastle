import"./modulepreload-polyfill-B5Qt9EMX.js";const t=document.createElement("style");t.textContent=`
@keyframes cell-ripple-expand {
    0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0.8;
    }
    100% {
        transform: translate(-50%, -50%) scale(3);
        opacity: 0;
    }
}

.l-piece.victory-piece {
    animation: victory-pulse 0.8s infinite alternate;
}

.l-piece.victory-glow {
    box-shadow: 0 0 20px currentColor, 0 0 40px currentColor !important;
    transform: scale(1.1) !important;
}

.blocking-highlight {
    background: rgba(255, 255, 0, 0.3) !important;
    animation: blocking-flash 1s infinite alternate;
}

@keyframes victory-pulse {
    0% { transform: scale(1); }
    100% { transform: scale(1.05); }
}

@keyframes blocking-flash {
    0% { background: rgba(255, 255, 0, 0.3) !important; }
    100% { background: rgba(255, 255, 0, 0.6) !important; }
}
`;document.head.appendChild(t);
//# sourceMappingURL=lgame-D_jdj3Aj.js.map

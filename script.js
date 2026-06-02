const livePill = document.querySelector(".live-pill");

if (livePill) {
  const updateLivePulse = () => {
    livePill.animate(
      [
        {
          transform: "scale(1)",
          boxShadow: "0 0 0 0 rgba(15, 118, 110, 0.24)",
        },
        {
          transform: "scale(1.04)",
          boxShadow: "0 0 0 12px rgba(15, 118, 110, 0)",
        },
      ],
      {
        duration: 1600,
        easing: "ease-out",
      },
    );
  };

  updateLivePulse();
  window.setInterval(updateLivePulse, 2600);
}

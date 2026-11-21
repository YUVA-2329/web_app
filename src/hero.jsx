import React from "react";

function Hero() {
  return (
    <section className="hero">

      <h1>IPL TICKET BOOKING 2026</h1>

      <p>
        Experience the excitement of IPL live!
        Book your favourite team's tickets now.
      </p>

      <button onClick={() => {
        document.getElementById("matches").scrollIntoView({
          behavior: "smooth"
        });
      }}>
        Book Tickets
      </button>

    </section>
  );
}

export default Hero;

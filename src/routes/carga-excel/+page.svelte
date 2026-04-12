<svelte:head>
    <title>En desarrollo</title>
</svelte:head>

<section class="coming">
    <div class="card">
        <p class="eyebrow">Tiempo</p>
        <h1>En desarrollo</h1>
        <p class="sub">Aun faltan detalles</p>
    </div>
</section>

<style>
    .coming {
        min-height: 100svh;
        display: grid;
        place-items: center;
        padding: 3rem 1.5rem;
        background: linear-gradient(140deg, #f3f2ec 0%, #e4f2ee 55%, #d7eef4 100%);
        color: #0b1f2f;
        font-family: "Space Grotesk", "Sora", "Work Sans", sans-serif;
    }

    .card {
        text-align: center;
        padding: 2.5rem 2rem;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.75);
        box-shadow: 0 18px 40px -30px rgba(11, 31, 47, 0.6);
        backdrop-filter: blur(6px);
    }

    .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.2em;
        font-size: 0.8rem;
        color: rgba(11, 31, 47, 0.6);
        margin: 0 0 0.75rem;
    }

    h1 {
        font-size: clamp(2.4rem, 6vw, 3.6rem);
        margin: 0 0 0.75rem;
    }

    .sub {
        font-size: 1.05rem;
        color: rgba(11, 31, 47, 0.75);
        margin: 0;
    }
</style>
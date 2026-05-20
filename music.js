document.addEventListener("DOMContentLoaded", () => {

    /* ================= ELEMENTS ================= */

    const musicOpenBtn =
    document.getElementById("musicOpenBtn");

    const musicModal =
    document.getElementById("musicModal");

    const closeMusic =
    document.getElementById("closeMusic");

    const audioPlayer =
    document.getElementById("audioPlayer");

    const playBtn =
    document.getElementById("playBtn");

    const pauseBtn =
    document.getElementById("pauseBtn");

    /* ================= DEBUG ================= */

    console.log("Music JS Loaded");

    console.log(musicOpenBtn);

    console.log(musicModal);

    /* ================= OPEN POPUP ================= */

    musicOpenBtn.addEventListener("click", () => {

        musicModal.classList.add("show");

    });

    /* ================= CLOSE POPUP ================= */

    closeMusic.addEventListener("click", () => {

        musicModal.classList.remove("show");

    });

    /* ================= PLAY ================= */

    playBtn.addEventListener("click", () => {

        audioPlayer.play();

    });

    /* ================= PAUSE ================= */

    pauseBtn.addEventListener("click", () => {

        audioPlayer.pause();

    });

});
document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('track');
    const timeDisplay = document.getElementById('time-display');
    const startOverlay = document.getElementById('start-overlay');
    const startBtn = document.getElementById('start-btn');
    const bgMusic = document.getElementById('bg-music');

    const DURATION_MS = 30000;
    let startTime = null;
    let isRacing = false;

    // Add Finish Line
    const finishLine = document.createElement('div');
    finishLine.className = 'finish-line';
    track.appendChild(finishLine);

    // Get list of all participants (excluding "Tổng")
    let allParticipants = new Set();
    raceData.forEach(step => {
        step.data.forEach(p => {
            if (!p.name.includes("Tổng")) {
                allParticipants.add(p.name);
            }
        });
    });

    const horseElements = {};

    // Create 10 background lanes
    for (let i = 0; i < 10; i++) {
        const laneBg = document.createElement('div');
        laneBg.className = 'lane';
        laneBg.style.top = `${i * 50}px`;
        track.appendChild(laneBg);
    }
    track.appendChild(finishLine);

    // Create Horse Elements
    Array.from(allParticipants).forEach((name) => {
        const horse = document.createElement('div');
        horse.className = 'horse-container';
        horse.id = `horse-${name}`;
        horse.innerHTML = `
            <div class="horse">🐎</div>
            <div class="info">
                ${name} <span class="val">0</span>
            </div>
        `;
        horse.style.display = 'none';
        track.appendChild(horse);
        horseElements[name] = horse;
    });

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / DURATION_MS, 1);

        const totalSteps = raceData.length - 1;
        const currentStepFloat = progress * totalSteps;
        const indexA = Math.floor(currentStepFloat);
        const indexB = Math.min(indexA + 1, totalSteps);
        const stepProgress = currentStepFloat - indexA;

        const dataA = raceData[indexA];
        const dataB = raceData[indexB];

        timeDisplay.innerText = dataA.label;

        const currentValues = [];
        const mapA = new Map(dataA.data.map(i => [i.name, i.val]));
        const mapB = new Map(dataB.data.map(i => [i.name, i.val]));

        // Find global max for scaling
        let globalMax = 0;
        raceData.forEach(s => s.data.forEach(d => {
            if (!d.name.includes("Tổng")) globalMax = Math.max(globalMax, d.val);
        }));

        for (let name in horseElements) {
            const valA = mapA.get(name) || 0;
            const valB = mapB.get(name) || 0;
            const currentVal = valA + (valB - valA) * stepProgress;
            currentValues.push({ name, val: currentVal });
        }

        currentValues.sort((a, b) => b.val - a.val);

        currentValues.forEach((item, rank) => {
            const el = horseElements[item.name];
            if (rank < 10 && item.val > 0) {
                el.style.display = 'flex';
                el.style.top = `${rank * 50 + 5}px`;
                const percent = (item.val / globalMax) * 90;
                el.style.left = `${percent}%`;
                el.querySelector('.val').innerText = Math.round(item.val) + 'k';
                el.style.zIndex = 100 - rank;
                el.style.transition = 'top 0.5s ease';
            } else {
                el.style.display = 'none';
            }
        });

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            timeDisplay.innerText = "KẾT THÚC NĂM 2025";
        }
    }

    startBtn.addEventListener('click', () => {
        startOverlay.style.display = 'none';
        bgMusic.play().catch(e => console.error("Audio playback failed:", e));
        isRacing = true;
        requestAnimationFrame(animate);
    });
});

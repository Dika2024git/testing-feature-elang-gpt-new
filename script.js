// script.js

// --- Elemen UI ---
const allowButton = document.getElementById('allowButton');
const pauseResumeButton = document.getElementById('pauseResumeButton');
const statusDiv = document.getElementById('status');
const controlsDiv = document.getElementById('controls');
const frequencySelect = document.getElementById('frequencySelect');
const inactiveOnlyCheckbox = document.getElementById('inactiveOnlyCheckbox');
const lastNotificationDiv = document.getElementById('lastNotification');
const nextNotificationInfoDiv = document.getElementById('nextNotificationInfo');
const logPanel = document.getElementById('logPanel');
const logList = document.getElementById('logList');

// --- State Aplikasi ---
let notificationTimeoutId = null;
let isPaused = false;
let currentPermission = 'default';
let notificationLog = []; // Menyimpan log notifikasi
const MAX_LOG_ENTRIES = 7; // Maksimal entri log yang ditampilkan
let lastNotificationTimestamp = 0; // Timestamp notifikasi terakhir
const NOTIFICATION_COOLDOWN = 45 * 1000; // Jeda minimal 45 detik antar notifikasi

// --- Pengaturan Frekuensi (min, max dalam ms) ---
const frequencySettings = {
    low: { min: 1200000, max: 1800000 }, // 20-30 menit
    medium: { min: 600000, max: 1200000 }, // 10-20 menit
    high: { min: 60000, max: 300000 }    // 1-5 menit
};

// --- Placeholder Dinamis ---
const randomFeatures = ["Analitik Cerdas", "Mode Gelap Otomatis", "Sinkronisasi Cloud", "Editor WYSIWYG", "Filter Lanjutan"];
const randomTips = ["gunakan shortcut keyboard", "atur pengingat", "bersihkan cache secara berkala", "manfaatkan template", "aktifkan autentikasi 2 faktor"];
const randomEvents = ["Webinar Eksklusif", "Sesi Tanya Jawab", "Update Sistem", "Peluncuran Produk Beta", "Kontes Komunitas"];
const randomBonuses = ["voucher diskon 10%", "akses premium 3 hari", "poin loyalitas ganda", "e-book gratis", "konsultasi singkat"];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// --- Konten Notifikasi (dengan tipe & placeholder dinamis) ---
const contentVariations = [
    { type: 'promo', title: "❗ Promo Spesial!", body: () => `Jangan lewatkan penawaran spesial untuk ${getRandomElement(randomFeatures)}.`, icon: 'https://img.icons8.com/fluent/48/000000/error.png', badge: 'https://img.icons8.com/ios-glyphs/30/000000/alarm.png', image: 'https://via.placeholder.com/300x150/FF6347/FFFFFF?text=PROMO' },
    { type: 'update', title: "✨ Update Tersedia!", body: () => `Fitur ${getRandomElement(randomFeatures)} baru saja ditingkatkan!`, icon: 'https://img.icons8.com/fluent/48/000000/new.png', badge: 'https://img.icons8.com/ios-glyphs/30/000000/star.png', image: 'https://via.placeholder.com/300x150/32CD32/000000?text=UPDATE', actions: [{ action: 'explore', title: 'Lihat Detail' }] },
    { type: 'tip', title: "💡 Tips Produktivitas", body: () => `Tahukah Anda? Coba ${getRandomElement(randomTips)}.`, icon: 'https://img.icons8.com/fluent/48/000000/lightbulb-idea.png', badge: 'https://img.icons8.com/ios-glyphs/30/000000/lightbulb.png' },
    { type: 'event', title: "🔔 Pengingat Acara", body: () => `Jangan lupa, acara '${getRandomElement(randomEvents)}' akan dimulai sebentar lagi!`, icon: 'https://img.icons8.com/fluent/48/000000/calendar.png', badge: 'https://img.icons8.com/ios-glyphs/30/000000/bell.png', actions: [{ action: 'view_details', title: 'Lihat Info'}] },
    { type: 'reward', title: "🚀 Kabar Gembira!", body: () => `Selamat! Anda baru saja mendapatkan ${getRandomElement(randomBonuses)}!`, icon: 'https://img.icons8.com/fluent/48/000000/confetti.png', badge: 'https://img.icons8.com/ios-glyphs/30/000000/gift.png', image: 'https://via.placeholder.com/300x150/1E90FF/FFFFFF?text=BONUS' },
    // --- Konten Spesifik Waktu ---
    { type: 'morning_greeting', timeOfDay: 'morning', title: "☀️ Selamat Pagi!", body: "Semoga harimu produktif! Awali dengan cek tugas penting.", icon: 'https://img.icons8.com/fluent/48/000000/sun.png', badge: 'https://img.icons8.com/ios-glyphs/30/000000/sunrise.png'},
    { type: 'afternoon_check', timeOfDay: 'afternoon', title: "☕ Waktunya Rehat Sejenak?", body: "Jangan lupa istirahat singkat untuk menyegarkan pikiran.", icon: 'https://img.icons8.com/fluent/48/000000/coffee-to-go.png', badge: 'https://img.icons8.com/ios-glyphs/30/000000/clock.png'},
    { type: 'evening_relax', timeOfDay: 'evening', title: "🌙 Waktunya Bersantai", body: "Sudah waktunya mengakhiri aktivitas. Siapkan diri untuk beristirahat.", icon: 'https://img.icons8.com/fluent/48/000000/moon-satellite.png', badge: 'https://img.icons8.com/ios-glyphs/30/000000/bed.png'}
];
// --- Akhir Konten ---

function getCurrentTimestamp() {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// --- Fungsi Seleksi Konten Berdasarkan Waktu ---
function selectContentVariation() {
    const currentHour = new Date().getHours();
    let timeOfDay = 'any';
    if (currentHour >= 5 && currentHour < 12) timeOfDay = 'morning';
    else if (currentHour >= 12 && currentHour < 18) timeOfDay = 'afternoon';
    else if (currentHour >= 18 || currentHour < 5) timeOfDay = 'evening';

    const relevantVariations = contentVariations.filter(v => v.timeOfDay === timeOfDay || !v.timeOfDay);
    if (relevantVariations.length === 0) {
         return contentVariations[Math.floor(Math.random() * contentVariations.length)];
    }
    return relevantVariations[Math.floor(Math.random() * relevantVariations.length)];
}

// --- Fungsi Inti Notifikasi ---
function displayNotification() {
    if (isPaused || currentPermission !== 'granted') return;

    const now = Date.now();
    if (now - lastNotificationTimestamp < NOTIFICATION_COOLDOWN) {
        console.log(`Cooldown aktif (${Math.round((NOTIFICATION_COOLDOWN - (now - lastNotificationTimestamp))/1000)}s tersisa), notifikasi dilewati.`);
        scheduleNextNotification();
        return;
    }

    if (inactiveOnlyCheckbox.checked && !document.hidden) {
        console.log("Tab aktif, notifikasi dilewati sesuai pengaturan.");
        scheduleNextNotification();
        return;
    }

    const variation = selectContentVariation();
    const notificationBody = typeof variation.body === 'function' ? variation.body() : variation.body;

    const options = {
        body: notificationBody,
        icon: variation.icon,
        badge: variation.badge,
        image: variation.image,
        tag: 'smart-notify-tag-' + variation.type,
        requireInteraction: !!variation.actions,
        actions: variation.actions || [],
    };

    try {
        console.log(`Menampilkan notifikasi (v3 - ${variation.type}):`, variation.title);
        const notification = new Notification(variation.title, options);

        lastNotificationTimestamp = Date.now();
        const logEntry = { title: variation.title, time: getCurrentTimestamp(), type: variation.type };
        addNotificationToLog(logEntry);

        lastNotificationDiv.textContent = `Notifikasi terakhir (${logEntry.type}): ${logEntry.title} (${logEntry.time})`;
        lastNotificationDiv.style.display = 'block';

        notification.onclick = (event) => {
            console.log('Notifikasi diklik!', event);
            window.focus();
            notification.close();
        };
        notification.onerror = (err) => console.error('Error Notifikasi:', err);

        if(options.actions.length > 0) {
             notification.onshow = () => console.warn(`Notifikasi '${variation.type}' dengan aksi ditampilkan.`);
        }

    } catch (error) {
        console.error('Gagal membuat notifikasi:', error);
    }

    scheduleNextNotification();
}

// --- Penjadwalan ---
function scheduleNextNotification() {
    if (notificationTimeoutId) clearTimeout(notificationTimeoutId);
    if (isPaused || currentPermission !== 'granted') {
         nextNotificationInfoDiv.textContent = isPaused ? "Status: Dijeda oleh pengguna." : "Status: Menunggu izin.";
         nextNotificationInfoDiv.style.display = 'block';
         return;
    }

    const selectedFrequency = frequencySelect.value;
    const settings = frequencySettings[selectedFrequency] || frequencySettings.medium;
    const { min, max } = settings;
    let randomDelay = min + Math.random() * (max - min);

    const delayInSeconds = Math.round(randomDelay / 1000);
    const delayInMinutes = (randomDelay / 60000).toFixed(1);

    console.log(`Notifikasi berikutnya dijadwalkan dalam ~${delayInSeconds} detik (${delayInMinutes} menit).`);
    nextNotificationInfoDiv.textContent = `Status: Menunggu jadwal berikutnya (~${delayInMinutes} menit). Cooldown: ${NOTIFICATION_COOLDOWN/1000}s.`;
    nextNotificationInfoDiv.style.display = 'block';

    notificationTimeoutId = setTimeout(displayNotification, randomDelay);
}

// --- Fungsi Log ---
function addNotificationToLog(entry) {
    notificationLog.unshift(entry);
    if (notificationLog.length > MAX_LOG_ENTRIES) {
        notificationLog.pop();
    }
    renderNotificationLog();
    logPanel.style.display = 'block';
}

function renderNotificationLog() {
    logList.innerHTML = '';
    if (notificationLog.length === 0) {
        logList.innerHTML = '<li>Belum ada notifikasi yang ditampilkan.</li>'; // Teks disesuaikan
        // Jangan sembunyikan panel jika memang sengaja ditampilkan setelah izin
        // logPanel.style.display = 'none';
        return;
    }
    notificationLog.forEach(entry => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="log-time">[${entry.time}]</span> <strong>(${entry.type})</strong> ${entry.title}`;
        logList.appendChild(li);
    });
}

// --- Update UI & State ---
function updateUIBasedOnPermission(permission) {
    currentPermission = permission;
    statusDiv.className = 'status-box';

    if (permission === 'granted') {
        statusDiv.textContent = 'Izin notifikasi diberikan. Kontrol tersedia di bawah.';
        statusDiv.classList.add('granted');
        allowButton.style.display = 'none';
        pauseResumeButton.style.display = 'inline-block';
        controlsDiv.style.display = 'block';
        logPanel.style.display = 'block'; // Selalu tampilkan panel log jika izin ada
        updatePauseResumeButton();
        renderNotificationLog(); // Pastikan log dirender saat izin pertama kali diberikan/load
        if(!isPaused) scheduleNextNotification();
    } else {
        controlsDiv.style.display = 'none';
        pauseResumeButton.style.display = 'none';
        allowButton.style.display = 'inline-block';
        lastNotificationDiv.style.display = 'none';
        nextNotificationInfoDiv.style.display = 'none';
        logPanel.style.display = 'none';

        if (permission === 'denied') {
            statusDiv.textContent = 'Anda memblokir izin notifikasi. Ubah di pengaturan browser.';
            statusDiv.classList.add('denied');
            allowButton.disabled = true;
        } else { // default
            statusDiv.textContent = 'Klik "Izinkan Notifikasi" untuk memulai.';
            allowButton.disabled = false;
        }
        if (notificationTimeoutId) clearTimeout(notificationTimeoutId);
        notificationTimeoutId = null;
    }
    // Tidak perlu render log di sini karena panel disembunyikan
}

function updatePauseResumeButton() {
    if (isPaused) {
        pauseResumeButton.textContent = 'Lanjutkan Notifikasi';
        pauseResumeButton.classList.remove('secondary');
    } else {
        pauseResumeButton.textContent = 'Jeda Notifikasi';
        pauseResumeButton.classList.add('secondary');
    }
}

// --- Event Listeners ---
// Pastikan elemen sudah ada sebelum menambahkan listener (aman karena script di akhir body)
if (allowButton) {
    allowButton.addEventListener('click', () => {
        Notification.requestPermission()
            .then(permission => {
                console.log('Hasil permintaan izin:', permission);
                updateUIBasedOnPermission(permission);
            })
            .catch(err => {
                 console.error("Error meminta izin:", err);
                 statusDiv.textContent = 'Gagal meminta izin notifikasi.';
                 statusDiv.className = 'status-box denied';
            });
    });
}

if (pauseResumeButton) {
    pauseResumeButton.addEventListener('click', () => {
        isPaused = !isPaused;
        console.log("Status jeda:", isPaused);
        updatePauseResumeButton();
        if (isPaused) {
            if (notificationTimeoutId) clearTimeout(notificationTimeoutId);
            nextNotificationInfoDiv.textContent = "Status: Dijeda oleh pengguna.";
        } else {
            scheduleNextNotification();
        }
    });
}

if (frequencySelect) {
    frequencySelect.addEventListener('change', scheduleNextNotification);
}
if (inactiveOnlyCheckbox) {
    inactiveOnlyCheckbox.addEventListener('change', () => console.log("Hanya saat tidak aktif:", inactiveOnlyCheckbox.checked));
}

// --- Inisialisasi ---
// Lakukan inisialisasi setelah DOM siap (meskipun script di akhir body sudah cukup aman)
document.addEventListener('DOMContentLoaded', () => {
    if (!("Notification" in window)) {
        if(statusDiv) {
            statusDiv.textContent = "Browser ini tidak mendukung Notifikasi Web.";
            statusDiv.className = 'status-box denied';
        }
        if(allowButton) allowButton.disabled = true;
    } else {
        // Periksa izin saat load & update UI
        currentPermission = Notification.permission; // Update state awal
        updateUIBasedOnPermission(currentPermission);
    }
});


document.addEventListener('visibilitychange', () => {
    console.log("Visibilitas tab berubah:", document.hidden ? "Tersembunyi" : "Terlihat");
});

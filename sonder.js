/* ---------------------------------------------------
   SONDER — Firebase Shared Edition
   --------------------------------------------------- */

   console.log("SONDER: Firebase version loaded.");


   // ---------- UTILITY ----------
   function createEntryObj(text, song, lat, lng, locationName) {
     return {
       text,
       song: song || "",
       lat,
       lng,
       locationName: locationName || "",
       createdAt: new Date().toISOString()
     };
   }
   
   
   // ---------- FIREBASE: LOAD ENTRIES ----------
   async function fetchEntries() {
     const snapshot = await db.collection("entries").orderBy("createdAt", "desc").get();
     return snapshot.docs.map(doc => ({
       id: doc.id,
       ...doc.data()
     }));
   }
   
   
   // ---------- FIREBASE: ADD ENTRY ----------
   async function addEntryToDB(entry) {
     await db.collection("entries").add(entry);
   }
   
   
   // ---------------------------------------------------
   // PAGE HANDLING
   // ---------------------------------------------------
   
   document.addEventListener("DOMContentLoaded", async () => {
     const page = document.body.getAttribute("data-page");
   
     if (page === "map") {
       initMapPage();
     }
   
     if (page === "submit") {
       initSubmitPage();
     }
   
     if (page === "archive") {
       initArchivePage();
     }
   
     if (page === "index") {
       initHomePage();
     }
   });
   
   
   // ---------------------------------------------------
   //  HOME PAGE (index.html)
   // ---------------------------------------------------
   
   function initHomePage() {
     console.log("Home page ready.");
   }
   
   
   // ---------------------------------------------------
   //  SUBMIT PAGE (submit.html)
   // ---------------------------------------------------
   
   function initSubmitPage() {
     console.log("Submit page ready.");
   
     const form = document.getElementById("submitEntryForm");
     const textEl = document.getElementById("submitEntryText");
     const songEl = document.getElementById("submitEntrySong");
     const imageEl = document.getElementById("submitEntryImage"); // unused right now
     const detectBtn = document.getElementById("submitDetectLocation");
     const locationHint = document.getElementById("submitLocationHint");
   
     let userLat = null;
     let userLng = null;
   
     // Acquire location
     function detectLocation() {
       locationHint.textContent = "detecting location…";
   
       navigator.geolocation.getCurrentPosition(
         pos => {
           userLat = pos.coords.latitude;
           userLng = pos.coords.longitude;
           locationHint.textContent = `location detected ✓`;
         },
         err => {
           locationHint.textContent = "failed to get location";
         }
       );
     }
   
     detectBtn.addEventListener("click", detectLocation);
     detectLocation();
   
     // Handle submit
     form.addEventListener("submit", async (e) => {
       e.preventDefault();
   
       if (!userLat || !userLng) {
         alert("Location not detected yet.");
         return;
       }
   
       const text = textEl.value.trim();
       const song = songEl.value.trim();
   
       if (!text) {
         alert("Write something first.");
         return;
       }
   
       const entry = createEntryObj(text, song, userLat, userLng, "");
   
       await addEntryToDB(entry);
   
       alert("Your entry has been added to the shared map.");
       window.location.href = "map.html";
     });
   }
   
   
   // ---------------------------------------------------
   //  MAP PAGE (map.html)
   // ---------------------------------------------------
   
   async function initMapPage() {
     console.log("Map page ready.");
   
     // create map
     const map = L.map("map").setView([14.5995, 120.9842], 12); // Manila default
   
     L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
       attribution: "&copy; OpenStreetMap contributors"
     }).addTo(map);
   
     // load entries
     const entries = await fetchEntries();
     console.log("Loaded entries:", entries);
   
     entries.forEach(entry => {
       const marker = L.marker([entry.lat, entry.lng]).addTo(map);
       marker.bindPopup(`
         <div style="max-width: 200px;">
           <p>${entry.text}</p>
           ${entry.song ? `<a href="${entry.song}" target="_blank">song link</a><br>` : ""}
           <small>${new Date(entry.createdAt).toLocaleString()}</small>
         </div>
       `);
     });
   }
   
   
   // ---------------------------------------------------
   //  ARCHIVE PAGE (archive.html)
   // ---------------------------------------------------
   
   async function initArchivePage() {
     console.log("Archive page ready.");
   
     const container = document.getElementById("archiveList");
     if (!container) return;
   
     const entries = await fetchEntries();
     console.log("Archive entries:", entries);
   
     entries.forEach(entry => {
       const item = document.createElement("div");
       item.className = "archive-item";
   
       item.innerHTML = `
         <p class="archive-text">${entry.text}</p>
         ${entry.song ? `<a class="archive-song" href="${entry.song}" target="_blank">${entry.song}</a>` : ""}
         <div class="archive-meta">
           <span>${new Date(entry.createdAt).toLocaleString()}</span>
         </div>
       `;
   
       container.appendChild(item);
     });
   }
   
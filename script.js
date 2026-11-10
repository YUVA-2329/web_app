// ============================================
// IPL TICKET BOOKING 2026 - JAVASCRIPT
// ============================================

// Match Information
const matches = {
    "01": {
        name: "CSK vs MI",
        date: "10 Apr 2026",
        venue: "Chennai",
        prices: {
            General: 1200,
            Premium: 2500,
            VIP: 5000
        }
    },

    "02": {
        name: "RCB vs MI",
        date: "14 Apr 2026",
        venue: "Bengaluru",
        prices: {
            General: 1500,
            Premium: 3000,
            VIP: 6000
        }
    },

    "03": {
        name: "DC vs CSK",
        date: "18 Apr 2026",
        venue: "Delhi",
        prices: {
            General: 1400,
            Premium: 3200,
            VIP: 6500
        }
    },

    "04": {
        name: "RR vs RCB",
        date: "22 Apr 2026",
        venue: "Jaipur",
        prices: {
            General: 1800,
            Premium: 3500,
            VIP: 7000
        }
    }
};


// ============================================
// 1. MATCH FILTERING
// ============================================

const teamFilter = document.getElementById("team");
const matchTable = document.getElementById("matchTable");

if (teamFilter && matchTable) {

    teamFilter.addEventListener("change", function () {

        const selectedTeam = this.value;

        const rows = matchTable.querySelectorAll("tr");

        rows.forEach(row => {

            const teams = row.dataset.teams || "";

            if (
                selectedTeam === "all" ||
                teams.split(" ").includes(selectedTeam)
            ) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }

        });

    });

}


// ============================================
// 2. BOOK BUTTON - REDIRECT TO BOOKING PAGE
// ============================================

document.querySelectorAll(".book-btn").forEach(button => {

    button.addEventListener("click", function () {

        const matchId = this.dataset.match;

        window.location.href =
            "booking.html?match=" + encodeURIComponent(matchId);

    });

});


// ============================================
// 3. LOAD SELECTED MATCH
// ============================================

const bookingForm = document.getElementById("bookingForm");

const matchSelect = document.getElementById("match");

if (bookingForm && matchSelect) {

    const urlParams = new URLSearchParams(window.location.search);

    const selectedMatch = urlParams.get("match");

    if (selectedMatch && matches[selectedMatch]) {

        matchSelect.value = selectedMatch;

    }

}


// ============================================
// 4. BOOKING SUMMARY
// ============================================

function updateBookingSummary() {

    if (!bookingForm) return;

    const matchId = document.getElementById("match")?.value;

    const stand = document.getElementById("stand")?.value;

    const quantity =
        Number(document.getElementById("tickets")?.value) || 0;

    const match = matches[matchId];

    const price =
        match && stand ? match.prices[stand] : 0;

    const total = price * quantity;

    const summaryMatch = document.getElementById("summaryMatch");
    const summaryStand = document.getElementById("summaryStand");
    const summaryPrice = document.getElementById("summaryPrice");
    const summaryQuantity = document.getElementById("summaryQuantity");
    const summaryTotal = document.getElementById("summaryTotal");

    if (summaryMatch) {
        summaryMatch.textContent = match ? match.name : "Not Selected";
    }

    if (summaryStand) {
        summaryStand.textContent = stand || "Not Selected";
    }

    if (summaryPrice) {
        summaryPrice.textContent = price ? price.toLocaleString("en-IN") : "—";
    }

    if (summaryQuantity) {
        summaryQuantity.textContent = quantity;
    }

    if (summaryTotal) {
        summaryTotal.textContent = total
            ? total.toLocaleString("en-IN")
            : "—";
    }

}


// Update summary whenever booking details change.

if (bookingForm) {

    ["match", "stand", "tickets"].forEach(id => {

        const field = document.getElementById(id);

        if (field) {
            field.addEventListener("change", updateBookingSummary);
            field.addEventListener("input", updateBookingSummary);
        }

    });

    updateBookingSummary();

}


// ============================================
// 5. SAVE BOOKING DETAILS
// ============================================

function getBookings() {

    return JSON.parse(
        localStorage.getItem("iplBookings") || "[]"
    );

}

function saveBooking(booking) {

    const bookings = getBookings();

    bookings.push(booking);

    localStorage.setItem(
        "iplBookings",
        JSON.stringify(bookings)
    );

}


// ============================================
// 6. FORM SUBMISSION AND VALIDATION
// ============================================

if (bookingForm) {

    bookingForm.addEventListener("submit", function (event) {

        event.preventDefault();

        if (!bookingForm.reportValidity()) {
            return;
        }

        const name = document.getElementById("name").value.trim();

        const email = document.getElementById("email").value.trim();

        const phone = document.getElementById("phone").value.trim();

        const matchId = document.getElementById("match").value;

        const stand = document.getElementById("stand").value;

        const quantity = Number(
            document.getElementById("tickets").value
        );

        const match = matches[matchId];

        if (!match) {
            alert("Please select a valid match.");
            return;
        }

        const price = match.prices[stand];

        const total = price * quantity;

        const booking = {

            id: Date.now(),

            name: name,

            email: email,

            phone: phone,

            match: match.name,

            matchId: matchId,

            date: match.date,

            venue: match.venue,

            stand: stand,

            tickets: quantity,

            price: price,

            total: total,

            preference:
                document.querySelector(
                    'input[name="preference"]:checked'
                )?.value || "Regular",

            bookingDate: new Date().toLocaleString("en-IN")

        };

        saveBooking(booking);

        alert(
            "Booking Successful!\n\n" +
            "Name: " + name + "\n" +
            "Match: " + match.name + "\n" +
            "Tickets: " + quantity + "\n" +
            "Total Amount: ₹" + total.toLocaleString("en-IN")
        );

        bookingForm.reset();

        window.location.href = "index.html#mybookings";

    });

}


// ============================================
// 7. DISPLAY MY BOOKINGS ON INDEX PAGE
// ============================================

function displayBookings() {

    const bookingsTable =
        document.getElementById("myBookingsTable");

    if (!bookingsTable) return;

    const bookings = getBookings();

    bookingsTable.innerHTML = "";

    if (bookings.length === 0) {

        bookingsTable.innerHTML = `
            <tr>
                <td colspan="5">No bookings available.</td>
            </tr>
        `;

        return;

    }

    bookings.forEach(booking => {

        const row = document.createElement("tr");

        [
            booking.match,
            booking.date + " - " + booking.venue,
            booking.stand,
            booking.tickets,
            "₹" + booking.total.toLocaleString("en-IN")
        ].forEach(value => {

            const cell = document.createElement("td");

            cell.textContent = value;

            row.appendChild(cell);

        });

        bookingsTable.appendChild(row);

    });

}


// ============================================
// 8. INITIALIZE WEBSITE
// ============================================

document.addEventListener("DOMContentLoaded", function () {

    displayBookings();

    updateBookingSummary();

    console.log("IPL Ticket Booking Website Initialized!");

});
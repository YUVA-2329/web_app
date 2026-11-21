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
// 1. REUSABLE TOAST NOTIFICATION
// ============================================

function showToast(message) {

    let toast = document.getElementById("toast");

    if (!toast) {

        toast = document.createElement("div");
        toast.id = "toast";

        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #222;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 9999;
            font-size: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;

        document.body.appendChild(toast);

    }

    toast.textContent = message;
    toast.style.opacity = "1";

    clearTimeout(toast.hideTimer);

    toast.hideTimer = setTimeout(() => {

        toast.style.opacity = "0";

    }, 3000);

}


// ============================================
// 2. MATCH FILTERING
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
// 3. BOOK BUTTON - REDIRECT TO BOOKING PAGE
// ============================================

document.querySelectorAll(".book-btn").forEach(button => {

    button.addEventListener("click", function () {

        const matchId = this.dataset.match;

        console.log("Book button clicked:", matchId);

        if (!matches[matchId]) {

            showToast("Invalid match selected!");

            return;

        }

        showToast("Redirecting to booking page...");

        setTimeout(() => {

            window.location.href =
                "booking.html?match=" + encodeURIComponent(matchId);

        }, 500);

    });

});


// ============================================
// 4. LOAD SELECTED MATCH
// ============================================

const bookingForm = document.getElementById("bookingForm");

const matchSelect = document.getElementById("match");

if (bookingForm && matchSelect) {

    const urlParams = new URLSearchParams(window.location.search);

    const selectedMatch = urlParams.get("match");

    if (selectedMatch && matches[selectedMatch]) {

        matchSelect.value = selectedMatch;

        updateBookingSummary();

        setTimeout(() => {

            bookingForm.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            showToast("Match selected successfully!");

        }, 300);

    }

}


// ============================================
// 5. BOOKING SUMMARY - LIVE UPDATE
// ============================================

function updateBookingSummary(showNotification = false) {

    if (!bookingForm) return;


    // Read selected values using DOM selectors.

    const matchId = document.getElementById("match")?.value || "";

    const stand = document.getElementById("stand")?.value || "";

    const quantityInput = document.getElementById("tickets");

    const quantity = Number(quantityInput?.value);


    // Get match details.

    const match = matches[matchId];

    const price = match && stand ? match.prices[stand] : 0;


    // Select Booking Summary elements.

    const summaryMatch = document.getElementById("summaryMatch");

    const summaryStand = document.getElementById("summaryStand");

    const summaryPrice = document.getElementById("summaryPrice");

    const summaryQuantity = document.getElementById("summaryQuantity");

    const summaryTotal = document.getElementById("summaryTotal");

    const summaryDate = document.getElementById("summaryDate");

    const summaryVenue = document.getElementById("summaryVenue");


    // Validate quantity.

    const validQuantity =
        Number.isInteger(quantity) && quantity >= 1 && quantity <= 10;


    // Update selected match.

    if (summaryMatch) {

        summaryMatch.textContent = match ? match.name : "Not Selected";

    }


    // Update stand.

    if (summaryStand) {

        summaryStand.textContent = stand || "Not Selected";

    }


    // Update ticket price.

    if (summaryPrice) {

        summaryPrice.textContent = price
            ? price.toLocaleString("en-IN")
            : "—";

    }


    // Update quantity.

    if (summaryQuantity) {

        summaryQuantity.textContent = validQuantity ? quantity : "—";

    }


    // Calculate total price.

    if (summaryTotal) {

        const total = validQuantity ? price * quantity : 0;

        summaryTotal.textContent = price && validQuantity
            ? total.toLocaleString("en-IN")
            : "—";

    }


    // Update match date.

    if (summaryDate) {

        summaryDate.textContent = match ? match.date : "—";

    }


    // Update venue.

    if (summaryVenue) {

        summaryVenue.textContent = match ? match.venue : "—";

    }


    // Show toast notification.

    if (showNotification) {

        if (!validQuantity) {

            showToast("Please select between 1 and 10 tickets.");

        } else if (match && stand) {

            showToast("Booking summary updated successfully!");

        }

    }

}


// ============================================
// 6. EVENT LISTENERS FOR LIVE INTERACTION
// ============================================

if (bookingForm) {

    // Match and Stand dropdown events.

    ["match", "stand"].forEach(id => {

        const field = document.getElementById(id);

        if (field) {

            field.addEventListener("change", () => {

                updateBookingSummary(true);

            });

        }

    });


    // Ticket quantity event.

    const ticketInput = document.getElementById("tickets");

    if (ticketInput) {

        ticketInput.addEventListener("input", () => {

            updateBookingSummary(false);

        });


        ticketInput.addEventListener("change", () => {

            updateBookingSummary(true);

        });

    }


    // Initial summary update.

    updateBookingSummary(false);

}


// ============================================
// 7. SAVE BOOKING DETAILS
// ============================================

function getBookings() {

    try {

        return JSON.parse(
            localStorage.getItem("iplBookings") || "[]"
        );

    } catch (error) {

        console.error("Unable to load bookings:", error);

        return [];

    }

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
// 8. FORM SUBMISSION AND VALIDATION
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

            showToast("Please select a valid match!");

            return;

        }


        const price = match.prices[stand];


        if (
            !price ||
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > 10
        ) {

            showToast("Please select valid booking details!");

            return;

        }


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


        try {

            saveBooking(booking);

        } catch (error) {

            console.error("Booking save failed:", error);

            showToast("Unable to save booking!");

            return;

        }


        showToast("Booking Successful!");


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
// 9. DISPLAY MY BOOKINGS ON INDEX PAGE
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
// 10. INITIALIZE WEBSITE
// ============================================

document.addEventListener("DOMContentLoaded", function () {

    displayBookings();

    updateBookingSummary();

    console.log("IPL Ticket Booking Website Initialized!");

});
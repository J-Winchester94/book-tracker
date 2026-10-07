const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const shelfList = document.getElementById("shelf");
const shelf = JSON.parse(localStorage.getItem("shelf")) || [];

function saveShelf() {
    localStorage.setItem("shelf", JSON.stringify(shelf));
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = (minutes % 60);
    return hours + "h " + mins + "m";
}

// Displays search results using the OpenLibrary API 
function renderResults(books) {
    searchResults.innerHTML = "";
    books.forEach(function (book) {

        const item = document.createElement("li");
        item.className = "card";

        if (book.cover_i) {
            const coverImage = document.createElement('img');
            coverImage.src = "https://covers.openlibrary.org/b/id/" + book.cover_i + "-M.jpg";
            coverImage.alt = book.title;
            item.appendChild(coverImage);

        }

        const title = document.createElement("h3");
        title.textContent = book.title;
        item.appendChild(title);

        const author = document.createElement("p");
        author.textContent = book.author_name ? book.author_name.join(", ") : "Unknown author";
        item.appendChild(author);

        const year = document.createElement("p");
        year.textContent = book.first_publish_year ? "First published: " + book.first_publish_year : "Unknown year";
        item.appendChild(year);

        const addButton = document.createElement("button");
        const alreadyOnShelf = shelf.some(function (saved){
            return saved.key === book.key;
        });

        if (alreadyOnShelf){
            addButton.textContent = "On shelf";
            addButton.disabled = true;
        } else {
            addButton.textContent = "Add to shelf";
        }
        
        addButton.addEventListener("click", function () {
            const shelfBook = {
                key: book.key,
                title: book.title,
                author: book.author_name ? book.author_name.join(", ") : "Unknown Author",
                coverId: book.cover_i,
                pages: book.number_of_pages_median,
                year: book.first_publish_year,
                status: "Want to Read"
            };
            shelf.push(shelfBook);
            saveShelf();
            renderShelf();

            addButton.textContent = "On shelf";
            addButton.disabled = true;

            console.log(shelf);
        });

        item.appendChild(addButton);
        searchResults.appendChild(item);
    });

}

// Displays saved books on the bookshelf
function renderShelf() {
    shelfList.innerHTML = "";

    shelf.forEach(function (book, index) {
        const item = document.createElement("li");
        item.className = "card";

        if (book.coverId) {
            const coverImage = document.createElement('img');
            coverImage.src = "https://covers.openlibrary.org/b/id/" + book.coverId + "-M.jpg";
            coverImage.alt = book.title;
            item.appendChild(coverImage);
        }

        const title = document.createElement("h3");
        title.textContent = book.title;
        item.appendChild(title);

        const author = document.createElement("p");
        author.textContent = book.author;
        item.appendChild(author);

        if (book.pages) {
            const pages = document.createElement("p");
            pages.textContent = book.pages + " pages";
            item.appendChild(pages);
        }

        // Create status select dropdown box
        const statusSelect = document.createElement("select");
        const statuses = ["Want to Read", "Reading", "Finished"];
        statuses.forEach(function (status) {
            const option = document.createElement("option");
            option.textContent = status;
            statusSelect.appendChild(option);
        });

        statusSelect.value = book.status;
        statusSelect.addEventListener("change", function () {
            shelf[index].status = statusSelect.value;
            saveShelf();
            renderShelf();
        });
        item.appendChild(statusSelect);


        // Display books in progess
        if (book.status === "Reading") {
            const formatSelect = document.createElement("select");
            const formats = ["Pages", "Audio"];

            //Define Pages and Audio formates
            formats.forEach(function (formatName) {
                const formatOption = document.createElement("option");
                formatOption.textContent = formatName;
                formatSelect.appendChild(formatOption);
            });

            formatSelect.value = book.format || "Pages";
            formatSelect.addEventListener("change", function () {
                shelf[index].format = formatSelect.value;
                saveShelf();
                renderShelf();
            });
            item.appendChild(formatSelect);
            // Physical book logic
            if (book.format !== "Audio") {
                if (!book.pages) {
                    // No page count from the API, so ask for one
                    const totalLabel = document.createElement("span");
                    totalLabel.textContent = "Total pages: ";

                    const totalInput = document.createElement("input");
                    totalInput.type = "number";
                    totalInput.min = 1;

                    totalInput.addEventListener("change", function () {
                        shelf[index].pages = Number(totalInput.value);
                        saveShelf();
                        renderShelf();
                    });

                    item.appendChild(totalLabel);
                    item.appendChild(totalInput);
                } else {
                    // Page tracker
                    const pageInput = document.createElement("input");
                    pageInput.type = "number";
                    pageInput.min = 0;
                    pageInput.max = book.pages;
                    pageInput.value = book.currentPage || 0;

                    pageInput.addEventListener("change", function () {
                        shelf[index].currentPage = Number(pageInput.value);
                        saveShelf();
                        renderShelf();
                    });
                    item.appendChild(pageInput);

                    const percentage = document.createElement("p");
                    const calculation = Math.round((book.currentPage || 0) / book.pages * 100);
                    percentage.textContent = calculation + "% · page " + pageInput.value + " of " + pageInput.max;
                    item.appendChild(percentage);

                    const pageProgress = document.createElement("progress");
                    pageProgress.max = book.pages;
                    pageProgress.value = book.currentPage || 0;
                    item.appendChild(pageProgress);
                }

                // Audiobook logic
            } else if (book.format === "Audio") {
                const length = book.audioLength || 0;

                const lengthHours = document.createElement("input");
                lengthHours.type = "number";
                lengthHours.min = 0;
                lengthHours.placeholder = "hours";
                lengthHours.value = Math.floor(length / 60);

                const lengthMinutes = document.createElement("input");
                lengthMinutes.type = "number";
                lengthMinutes.min = 0;
                lengthMinutes.max = 59;
                lengthMinutes.placeholder = "minutes";
                lengthMinutes.value = length % 60;

                function saveLength() {
                    const totalLength = Number(lengthHours.value) * 60 + Number(lengthMinutes.value);
                    shelf[index].audioLength = totalLength;
                    saveShelf();
                    renderShelf();
                }
                lengthHours.addEventListener("change", saveLength);
                lengthMinutes.addEventListener("change", saveLength);

                const lengthLabel = document.createElement("span");
                lengthLabel.textContent = "Length: "
                item.appendChild(lengthLabel);
                item.appendChild(lengthHours);
                item.appendChild(lengthMinutes);

                const position = book.audioPosition || 0;
                const positionHours = document.createElement("input");
                positionHours.type = "number";
                positionHours.min = 0;
                positionHours.placeholder = "hours";
                positionHours.value = Math.floor(position / 60);

                const positionMinutes = document.createElement("input");
                positionMinutes.type = "number";
                positionMinutes.min = 0;
                positionMinutes.max = 59;
                positionMinutes.placeholder = "minutes";
                positionMinutes.value = position % 60;

                function savePosition() {
                    const totalPosition = Number(positionHours.value) * 60 + Number(positionMinutes.value);
                    shelf[index].audioPosition = totalPosition;
                    saveShelf();
                    renderShelf();
                }
                positionHours.addEventListener("change", savePosition);
                positionMinutes.addEventListener("change", savePosition);

                const positionLabel = document.createElement("span");
                positionLabel.textContent = "Position: ";
                item.appendChild(positionLabel);
                item.appendChild(positionHours);
                item.appendChild(positionMinutes);

                if (book.audioLength) {
                    const audioProgress = document.createElement("progress");
                    audioProgress.max = book.audioLength;
                    audioProgress.value = position;

                    const audioPercent = Math.round(position / book.audioLength * 100);
                    const audioPercentage = document.createElement("p");
                    audioPercentage.textContent = audioPercent + "% " + formatTime(position) + " of " + formatTime(book.audioLength);
                    item.appendChild(audioPercentage);
                    item.appendChild(audioProgress);
                }
            }
        }

        // Create delete button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-button";
        deleteButton.addEventListener("click", function () {
            if (confirm("Remove book from shelf?")) {
                shelf.splice(index, 1);
                saveShelf();
                renderShelf();
            }
        });

        item.appendChild(deleteButton);

        shelfList.appendChild(item);
    });
}

// Create a search form that connects to the API
searchForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const query = searchInput.value.trim();
    const url = "https://openlibrary.org/search.json?q=" + encodeURIComponent(query) +
        "&fields=title,author_name,first_publish_year,cover_i,number_of_pages_median,key";
    const response = await fetch(url);
    const data = await response.json();
    renderResults(data.docs);
});

renderShelf();
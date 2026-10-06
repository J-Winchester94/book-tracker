const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const shelfList = document.getElementById("shelf");
const shelf = JSON.parse(localStorage.getItem("shelf")) || [];

function saveShelf() {
    localStorage.setItem("shelf", JSON.stringify(shelf));
}

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
        addButton.textContent = "Add to shelf";
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
            console.log(shelf);
        });
        item.appendChild(addButton);

        searchResults.appendChild(item);

    });

}

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
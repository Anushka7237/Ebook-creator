const Book = require("../models/Book");

// @desc   Create a new Book
// @route  POST /api/books
// @access Private
const createBook = async (req, res) => {
  try {
    const { title, subtitle, author, chapters } = req.body;

    if (!title || !author) {
      return res.status(400).json({ message: "Title and author are required" });
    }

    const book = await Book.create({
      userId: req.user._id,
      title,
      subtitle,
      author,
      chapters: chapters || [],
    });

    res.status(201).json(book);
  } catch (error) {
    console.log("CREATE BOOK ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Get all books for a user
// @route  GET /api/books
// @access Private
const getBooks = async (req, res) => {
  try {
    const books = await Book.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json(books);
  } catch (error) {
    console.log("GET BOOKS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Get a single book by ID
// @route  GET /api/books/:id
// @access Private
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.userId.toString() !== req.user.id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to view this book" });
    }
    res.status(200).json(book);
  } catch (error) {
    console.log("GET BOOK BY ID ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Update a book
// @route  PUT /api/books/:id
// @access Private
const updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.userId.toString() != req.user._id.toString()) {
      return res
        .status(401)
        .json({ message: "Not authorized to update this book" });
    }
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(updatedBook);
  } catch (error) {
    console.log("UPDATE BOOK ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Delete a book
// @route  DELETE /api/books/:id
// @access Private
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.log("DELETE BOOK ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc   Update a book's cover image
// @route  PUT /api/books/cover/:id
// @access Private
const updateBookCover = async (req, res) => {
  try {
    const book = await Book.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    book.coverImage = `${req.file.filename}`;
    const updatedBook = await book.save();

    res.status(200).json(updatedBook);
  } catch (error) {
    console.log("UPDATE COVER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  updateBookCover,
};

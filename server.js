const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const sqlite3 = require("sqlite3").verbose();
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());


const database = new sqlite3.Database("todo_tasks.db", (error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Connected to SQLite database");

    database.run(`CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      task TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      priority TEXT,
      is_done BOOLEAN NOT NULL DEFAULT 0
    )`);
  }
});


app.get('/get-tasks', (request, response) => {
  database.all('SELECT * FROM todos', [], (error, rows) => {
    if (error) {
      response.status(400)
      response.json(error);
      return;
    }
    response.json(rows);
  });
  });

app.post("/create-tasks", (request, response) => {
  const { task, description, due_date, priority, is_done } = request.body;
  const uuId = uuidv4();
  console.log(request.body)
  console.log(due_date)
  console.log(is_done)
  const query = `INSERT INTO todos (id, task, description, due_date, priority, is_done) VALUES (?, ?, ?, ?, ?, ?)`;
  const values = [uuId, task, description, due_date, priority, is_done ? 1 : 0];

  database.run(query, values, function (error) {
    if (error) {
      console.error(error);
      response.status(400)
      response.json(error);
      return;
    }
    response.status(200)
    response.json('Task successfully created!');
    console.log(uuId)
  });
});


app.put("/update-task/:id", (request, response) => {
  const { id } = request.params;
  const { task, description, due_date, priority, is_done } = request.body;

  const fields = [];
  const values = [];

  if (task !== undefined) {
    fields.push("task = ?");
    values.push(task);
  }
  if (description !== undefined) {
    fields.push("description = ?");
    values.push(description);
  }
  if (due_date !== undefined) {
    fields.push("due_date = ?");
    values.push(due_date);
  }
  if (priority !== undefined) {
    fields.push("priority = ?");
    values.push(priority);
  }
  if (is_done !== undefined) {
    fields.push("is_done = ?");
    values.push(is_done ? 1 : 0); 
  }

  console.log('Received update for task ID:', id, 'with body:', request.body);

  if (fields.length === 0) {
    return response.status(400).json({ error: "No fields provided for update" });
  }

  const query = `UPDATE todos SET ${fields.join(", ")} WHERE id = ?`;
  values.push(id); 

  database.run(query, values, function (error) {
    if (error) {
      console.error("Database error:", error);
      return response.status(400).json({ error: error.message });
    }
    response.json({ message: 'Updated successfully' });
  });
});


app.delete("/delete-task/:id", (request, response) => {
  const { id } = request.params;
  console.log(id); 

  database.run("DELETE FROM todos WHERE id = ?", id, function (error) {
    if (error) {
      console.error(error); 
      response.status(400);
      response.json(error);
      return 
    }

    response.status(200);
    response.json("Task deleted successfully");
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

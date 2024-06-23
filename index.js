import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;
 
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "saaladb",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

async function userLis(){
  try{
    const user_lis=await db.query("SELECT * FROM users");
    console.log(user_lis.rows);
    return user_lis.rows;
  }
  catch(err){
    return "There Is No  User To Display...!"
  }
}

async function checkVisisted(user_id) {
  const result = await db.query("SELECT country_code FROM visited_countries JOIN users ON users.id=user_id WHERE user_id=$1",[user_id]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted(currentUserId);
  const colorLis=await db.query('SELECT color FROM users WHERE id=$1',[currentUserId]);
  const color=colorLis.rows[0].color;
  const users= await userLis();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color
  });
});

app.post("/user",async (req,res)=>{
  const body=req.body;
  if(body.add){
    res.render("new.ejs")
  }else{
  currentUserId=parseInt(body.user);
  res.redirect('/');
  console.log(currentUserId);}
})


app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE $1 || '%'",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code,user_id) VALUES ($1,$2)",
        [countryCode,currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(`You Can't Add Countries Twice...!`);
      const countries=await checkVisisted(currentUserId);
      const colorLis=await db.query('SELECT color FROM users WHERE id=$1',[currentUserId]);
      const color=colorLis.rows[0].color;
      const users=await userLis();
      res.render("index.ejs",{countries: countries,
        total: countries.length,
        users: users,
        color, error:`You Can't Add Country Twice`})
      
    }
  } catch (err) {
    console.log("There Is NO Country Like That ...!");
    const countries=await checkVisisted(currentUserId);
    const colorLis=await db.query('SELECT color FROM users WHERE id=$1',[currentUserId]);
    const color=colorLis.rows[0].color;
    const users=await userLis()
      res.render("index.ejs",{countries: countries,
        total: countries.length,
        users: users,
        color, error:`No Country By That Name...!`})
  }
});

app.post("/new", async (req, res) => {
  const data=req.body;
  try{  
  await db.query("INSERT INTO users(name,color) VALUES($1,$2)",[data.name,data.color]);
  res.redirect('/')
}
  catch(err){
    console.log("New User Only...!");
    const countries=await checkVisisted(currentUserId);
    const colorLis=await db.query('SELECT color FROM users WHERE id=$1',[currentUserId]);
    const color=colorLis.rows[0].color;
    const users=await userLis()
      res.render("index.ejs",{countries: countries,
        total: countries.length,
        users: users,
        color, error:`New User Only`})
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config(); // 이렇게 하면 .env 파일을 읽어서 process.env로 만들어준다.
const indexRouter = require("./routes");
const userRouter = require("./routes/user");

const app = express();
app.set("port", process.env.PORT || 3000);

app.use(morgan("dev")); // 추가적인 정보를 콘솔에 로깅해주는 미들웨어. dev, combined, common, short, tiny 등
app.use("/", express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET)); // 쿠키를 알아서 파싱해서 req.cookies에 넣어준다. 여기서 뭔가 생성해주는 게 아니라, 생성할 때 이렇게 파싱하라고 알려주는 것.
// 만들 때는 res.cookie(키, 값, 옵션) 를 써야한다.
// 위의 경우 COOKIE_SECRET 의 값으로 비밀키를 넣어준 것. 서명된 쿠키가 있을 경우 이 비밀키를 통해 검증하고. req.signedCookies객체에 넣어준다.
app.use(
  // express-session. cookieParser 뒤에 작성하는 것이 안전하다.
  session({
    // req.session 객체 안에 유지된다.
    resave: false, // 변경사항이 없더라도 다시 저장할 건지 설정
    saveUninitialized: false, // 세션에 저장할 내역이 없어도 처음부터 세션을 생성할지 설정
    secret: process.env.COOKIE_SECRET, // 쿠키에 서명을 추가
    cookie: {
      // 세션 쿠키에 대한 설정
      httpOnly: true, // 클라이언트에서 쿠키 확인 불가
      secure: false, // https 가 아니라도 가능
    },
    name: "session-cookie",
  })
); // 이러한 미들웨어들은 내부적으로 next()를 실행하기 때문에 굳이 안넣어줘도 된다.
// static 제공 미들웨어는 res.send, res.sendFile 로 응답을 보내고 next()하지 않기 때문에 뒤에 있는 미들웨어를 실행하지 않는다.

app.use("/", indexRouter);
app.use("/user", userRouter);

app.use((req, res, next) => {
  res.status(404).send("Not Found");
});
// const multer = require("multer");
// const fs = require("fs");

// try {
//   fs.readdirSync("uploads");
// } catch (err) {
//   console.error("upload 폴더 없으므로 생성");
//   fs.mkdirSync("uploads");
// }

// const upload = multer({
//   storage: multer.diskStorage({
//     destination(req, file, done) {
//       done(null, "uploads/");
//     },
//     filename(req, file, done) {
//       const ext = path.extname(file.originalname);
//       done(null, path.basename(file.originalname, ext) + Date.now() + ext);
//     },
//   }),
//   limits: { fileSize: 5 * 1024 * 1024 },
// });
// app.get("/upload", (req, res) => {
//   res.sendFile(path.join(__dirname, "multipart.html"));
// });
// app.post(
//   "/upload",
//   upload.fields([{ name: "image1" }, { name: "image2" }]),
//   (req, res) => {
//     console.log(res.files, req.body);
//     res.send("OK");
//   }
// );

// app.use((req, res, next) => {
//   console.log("모든 요청에 다 실행됩니다.");
//   next();
// });

app.get(
  "/",
  (req, res, next) => {
    console.log("get / 요청에서만 실행됩니다.");
    next(); // 다음 미들웨어 호출
  },
  (req, res) => {
    // 그냥 여러개의 미들웨어를 장착할 수 있는 것
    throw new Error("에러는 에러 처리 미들웨어로 갑니다.");
  }
);

app.use((err, req, res, next) => {
  // 매개변수가 네개면 에러를 처리하는 미들웨어다. 커스텀.
  console.error(err);
  res.status(500).send(err.message);
});
app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기 중");
});

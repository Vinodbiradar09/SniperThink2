import "dotenv/config";
import { createHttp } from "./http.js";
import { fatal } from "./fatal.js";

const PORT = process.env.PORT;

const bootstap = async () => {
  const app = createHttp();
  app.listen(PORT, () => {
    console.log("server is running at 4005");
  });
};
bootstap().catch(fatal);

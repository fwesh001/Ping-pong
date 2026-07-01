import app from "./app.js";

const port = process.env.EXPRESS_PORT ?? process.env.PORT ?? 9000;

app.listen(Number(port), () => {
  // eslint-disable-next-line no-console
  console.log(`Express server listening on port ${port}`);
});

export default app;

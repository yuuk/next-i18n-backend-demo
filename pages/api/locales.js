export default function handler(req, res) {
    const { lng, ns } = req.query;

    console.error(req.query);

    const locales = {
      common: {
        message: `Hello from Next.js!`
      }
    }

    res.status(200).json(locales)
  }
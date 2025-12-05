# 🎨 Doodle Generator, so no one has to draw

A small tool that generates doodles so none of you have to draw, you can thank me later 

## Setup

1. Install Node 18+.
2. Clone the repo:
   
   ```shell
   git clone https://github.com/blemmers/doodleworkshop.git
   cd doodleworkshop
   ```

3. Install dependencies:
   
   ```shell
   npm install
   ```

4. Create a .env file:
   
   ```shell
   cp .env.example .env
   ```

   Add the OpenAI API key:
   
   ```shell
   OPENAI_API_KEY=sk-...
   PORT=3000
   ```

   Source the new environment variables:

   ```shell
   source .env
   ```

## ▶️ Run

```shell
npm start
```

Open: http://localhost:3000

## 💡 How it works

- Type a trend or idea into a tile
- Click Generate
- The app creates an SVG doodle
- Drag or download the SVG into Miro 
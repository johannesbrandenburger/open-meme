# OpenMeme - The Open Source Meme Game

OpenMeme is a web-based open source clone of the popular game "Make it Meme".
It uses the memegen repository as a source for meme templates and lets friends play together in a real-time game.

Each round, players are given a random meme template and a short time to add their own text. After the creation phase, players anonymously vote on the memes, and the player with the highest-voted meme wins the round. The game continues for a few rounds, and the player with the highest total score at the end wins the game. The game principle is highly inspired by [Make it Meme](https://makeitmeme.com).

**Technologies:**

-   Frontend: React, TypeScript
-   Backend: Convex (This project primarily exists to explore and utilize Convex!)

**Contribution to Meme Source:**

This project utilizes meme templates from the [memegen](https://github.com/jacebrowning/memegen) repository. Contributions to the original repository are highly encouraged to expand the available meme selection.

**Inspiration:**

The game principle is highly inspired by [Make it Meme](https://makeitmeme.com).


**Getting Started:**

1.  Clone the repository: `git clone https://github.com/johannesbrandenburger/open-meme.git`
2.  Install dependencies: `npm install`
3.  Set up Convex: Follow the instructions on [Convex documentation](https://docs.convex.dev/)
4.  Start the development server: `npm run dev`
5.  Open your browser and navigate to `http://localhost:3000`

**Update the Memes**

- if the memes in the memegen repository are updated, you can update the memes in this project by doing the following:
- clone the memegen repository: `git clone https://github.com/jacebrowning/memegen.git` (at project root)
- run `npm run update-memes`
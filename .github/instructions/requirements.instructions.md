---
applyTo: "**/*"
---

# OpenMeme - The Open Source Meme Game - Requirements

OpenMeme is a web-based open source clone of the popular game "Make it Meme".
It uses the memegen repository as a source for meme templates and lets friends play together in a real-time game.

## Game Process

1. **Game Creation**:

- a user enters `open-meme.io`
- he (host) can create a game by clicking a button
- a new game is created with a unique link (e.g., `open-meme.io/game/f43fe43`)
- the link is copied to the clipboard so that the host can share it with friends
- the host enters a nickname (stored in local storage) if not already set
- the host is on a waiting screen and waits for other players to join
- the host can start the game at any time by clicking a button

2. **Player Joining**:

- a player clicks the link shared by the host
- the player is redirected to the game page
- the player enters a nickname (stored in local storage) if not already set
- the player is shown a waiting screen until the host starts the game

3. **Game Start**:

- when the host starts the game, all players get in the *meme creation screen*
- the host is now just a normal player
- *meme creation screen*:
  - a random meme template is selected and displayed (different meme for each player)
  - the template is shown with empty text slots
  - the player can fill in the text slots by typing in input fields (below the image)
  - the player inputs are shown in real-time on the meme image in a "meme font" style
  - the player can also shuffle to another random meme template by clicking a button (5 shuffles allowed)
    - text inputs are cleared when shuffling
  - the players have a time limit to fill in the text slots (e.g., 60 seconds)
- after the time is up, the player can no longer edit the meme and the players are shown the *voting screen*
- *voting screen*:
  - the created memes are shown to the players (without the nicknames)
  - each meme for 30 seconds (stop early if all players have already voted)
  - the players see the same meme at every time
  - the players can upvote (+1 point), downvote (-1 point) or skip (0 points) each meme
  - the players can only vote once per meme
  - the players can see their own meme but not vote on it
- after all memes have been shown, the players are shown the *round results screen*
- *round results screen*:
  - the players see the results of the voting (top voted first, down to the last)
  - the players see who created which meme (by nickname)
  - the players see the scores of the memes (points)
- after 10s the next round starts with the same process (starting at the *meme creation screen*)
- the game ends after 3 rounds
- the players are shown the *game results screen*
- *game results screen*:
  - the players see the final scores of all players (winners' podium)
  - the players see the memes again in the order of the scores

## Technical Notes

- the meme templates are already in a folder: `./memegen/templates`, each named after the meme
  - `./memegen/templates/<meme-name>/default.jpg`
    - the image for the meme
  - `./memegen/templates/<meme-name>/config.yml`
    - the information about the slots to fill in (in yaml: "text")
    - example for <meme-name>: "blb"
      ```yaml
      name: Bad Luck Brian
      source: http://knowyourmeme.com/memes/bad-luck-brian
      text:
        - style: upper
          color: white
          font: thick
          anchor_x: 0.0
          anchor_y: 0.0
          angle: 0.0
          scale_x: 1.0
          scale_y: 0.2
          align: center
          start: 0.0
          stop: 1.0
        - style: upper
          color: white
          font: thick
          anchor_x: 0.0
          anchor_y: 0.8
          angle: 0.0
          scale_x: 1.0
          scale_y: 0.2
          align: center
          start: 0.0
          stop: 1.0
      example:
        - falls asleep in class
        - has a wet dream
      ```
- the create memes should not be stored as images, but only like this:
    ```json
    {
      "img": "blb",
      "texts": [
        "falls asleep in class",
        "has a wet dream"
      ]
    }
    ```
    to save space
- shadcn should be used for the UI components
- the design should be simple and clean and specifically optimized for mobile devices
- no auth is required
  - if the user enters a nickname, it should be stored in the browser's local storage
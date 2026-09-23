# Concept Space

A responsive, interactive classroom activity about concepts as vectors, inspired by Piantadosi et al. (2024), [Why concepts are (probably) vectors](https://doi.org/10.1016/j.tics.2024.06.011).

## Run locally

Open `index.html` in a browser, or serve this directory with `python3 -m http.server 8000` and visit http://localhost:8000. No build or package installation is required.

## Publish on GitHub Pages

1. Create a GitHub repository and upload `index.html`, `styles.css`, `app.js`, and `.nojekyll` to its root.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select **main** and **/ (root)**, then save.
4. Once GitHub finishes deployment, open the URL shown in Pages settings (usually `https://USERNAME.github.io/REPOSITORY/`).

Relative asset paths support repository and custom-domain sites. The interface uses system fonts and needs no external font downloads. No server, credentials, or API keys are needed.

## Two activity tabs

**Guided activity** retains the five-step drink exercise and existing saved progress.

**Open exploration** starts with an empty map. Define the negative and positive endpoints of X and Y, add your own concepts, and position them by dragging, sliders, or arrow keys. All concepts in this tab can be removed. Switch from Move concepts to Draw arrows to select two locations, or choose two concepts from the endpoint dropdowns. Arrows show ΔX and ΔY and retain their coordinates when concepts move. Renaming axes does not reposition points.

Tabs use independent local-storage keys (`concept-space-guided-v2` and `concept-space-explore-v1`). Switching tabs preserves both maps and cancels unfinished arrow selections. Use Left/Right, Home, or End while focused on a tab to switch with the keyboard. Everything remains a static site; no additional files or services are needed for GitHub Pages.

## Classroom flow

The five-step guide reveals controls and prompts as students progress. Back revisits earlier steps, and progress resumes on reload.

1. **Read the map.** Temperature runs from Cold on the left to Hot on the right; caffeine per serving runs bottom to top. Compare iced and hot coffee. Coordinates are illustrative scores, not degrees or milligrams; negative coordinates do not mean negative caffeine.
2. **Place and compare.** Explore six concepts: hot/iced coffee, hot/iced tea, and hot/iced milk. Students can drag points, select drink buttons and use sliders, or focus points and use arrow keys. Assume equal servings and the same recipe within each pair, with temperature alone changing. Tea is placed below coffee for this simplified example; actual caffeine depends on preparation.
3. **Predict.** Complete “iced coffee is to hot coffee as X is to hot tea.” Students select a prediction before continuing and can record their reasoning. Arrows and results stay hidden.
4. **Reveal and experiment.** Compute **X = hot tea − hot coffee + iced coffee = (−3, 0)** in the starting map: iced tea. Both arrows represent the same displacement. Move hot tea upward one unit while leaving iced tea fixed to see the exact analogy fail. Predictions outside the grid retain their coordinates and are reported explicitly.

5. **Draw your own arrows.** Click or tap two locations in the plot, first the start and then the end. Endpoints snap to drinks within 0.4 map units. Alternatively, choose two drinks from the dropdowns, or focus drink points and use Enter/Space to choose endpoints. Escape or Cancel start cancels a pending arrow. Each arrow lists its coordinates and displacement (ΔX, ΔY). Switch between drawing and moving drinks. Remove individual arrows or clear all; custom arrows keep their coordinates when drinks move or the example is restored, and save locally with the activity. They are visible in step five; the worked analogy is visible in step four.

Use **Add your own drink** to enter a name such as Cold brew. The new point starts at (0, 0), is selected automatically, and can be positioned with sliders, dragging, or arrow keys—even in the first step. Custom drinks appear in prediction choices and the arrow endpoint selectors. Names must be unique (ignoring case) and at most 32 characters. Select a custom drink and choose **Remove this drink** to delete it. Custom drinks and their positions save with the map.

Restore example resets the original six drinks and axis labels, preserving custom drinks, the current step, prediction, and reasoning. The fixed analogy prevents the introductory task from changing accidentally. Step four reports the predicted coordinates in the guide and draws the worked analogy directly on the map. A brief research connection appears beneath the map in steps four and five.

Progress, predictions, reasoning, coordinates, and labels save locally in the browser when available. There is no analytics or submission service. Clearing browser data removes saved work. Existing saved maps retain their positions; the horizontal axis uses Cold / Hot. Drink names remain unchanged.

## Scientific framing

The paper's account extends beyond hand-labeled similarity dimensions to structured representations and computations over vectors. Failure of this two-dimensional visualization is not evidence that high-dimensional vector representations cannot support a concept. The number and interpretation of useful dimensions depend on the representation and task.

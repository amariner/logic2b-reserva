# Platform artwork · 2026-09-08

New media and code-built interfaces for “Bonita por fuera. Bien resuelta por dentro.”, requested for publication by the owner.

## Image

`brasca-editorial-source.png` was generated with the built-in OpenAI image tool, using the existing `apps/web/assets/heroes/generated/brasca-v2.png` as a reference. The imagegen skill guided the reference-based generation and saving the source inside this project. Production uses WebP derivatives in `apps/site/public/images/platform/`; the source is not served.

Final prompt: “Use case: photorealistic-natural. Create a new editorial photograph for the fictional Brasca restaurant website, inspired by the supplied interior reference (reference only, no need to preserve exact geometry). Landscape 16:9 high resolution. Intimate Mediterranean bistro, warm terracotta plaster, oak table, amber glassware, cream linen, wood-fired oven with subtle flame in background. Foreground on right a beautifully plated chargrilled seasonal vegetable dish in handmade ceramic with olive oil and herbs, tactile and appetizing. Late afternoon sunlight from left, cinematic but authentic hospitality photography, deep warm shadows in left third for readable white website title overlaid later in HTML. Rich tangible food texture, refined warm editorial art direction, restrained composition, no people, no text, no logos, no watermarks. Actual photographic look, not an illustration, not a UI mockup.”

The account's uploaded image catalog was inspected, but its CloudFront download URLs returned HTTP 403 both locally and inside Higgsfield. No inaccessible upload was used or claimed as a source.

## Higgsfield films

Model: `seedance_2_5`; two silent five-second 720p 16:9 clips. They load only after explicit playback, alternate while playing, and pause when outside the viewport, hidden by a tab, or when the document is hidden. The static photo remains the fallback. No remote embeds, tracking, or third-party runtime calls are used.

- `brasca-atmosphere.mp4`, job `32d7cfd7-5fd1-4f31-94c1-dd803c9fe444`: “A refined editorial hospitality film for fictional Mediterranean bistro Brasca. One continuous very slow camera push towards a handmade ceramic plate of chargrilled seasonal vegetables with olive oil and herbs on an oak dining table, amber glassware and cream linen. Terracotta plaster and a wood fired oven with gentle flames in soft focus behind. Late afternoon golden sunlight, warm rich shadows, tactile photographic realism. No people, no text, no logos, no graphics, no cuts, no sudden motion. Keep composition calm and consistent throughout, perfect as a silent restaurant website background.”
- `brasca-cuisine.mp4`, job `e9e19d34-6826-412b-90d1-c2a96b9855de`: “Silent five second macro editorial food film for a warm Mediterranean bistro website. Single continuous very slow lateral camera slide and gentle focus shift across a handmade cream ceramic plate of chargrilled aubergine, courgette, red pepper and cherry tomatoes, fresh herbs and glossy olive oil on oak wood. Warm terracotta background, amber glassware in creamy bokeh, golden late afternoon side light. Refined natural restaurant photography, extremely tangible food textures, inviting and realistic. No people, hands, text, logos, graphics, cuts, or sudden motion. Compose food on the right with darker out of focus restaurant background on left for future web typography.”

The graphic interfaces are illustrative compositions, not screenshots or new booking functionality. All controls inside the illustrations are decorative; actual zoom and playback buttons sit outside the accessible image.

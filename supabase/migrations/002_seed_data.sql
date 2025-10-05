-- Insert sample datasets
INSERT INTO datasets (creator_id, title, description, tags, price, modality, accent_color, schema_fields, sample_data, notes)
SELECT 
  id,
  'A Photographic Archive of Brutalist Architecture in Pittsburgh',
  '400+ high-resolution photos of Pittsburgh''s brutalist landmarks, annotated with architect, year, and material data.',
  ARRAY['vision', 'architecture', 'pittsburgh'],
  149,
  'vision',
  'bg-yellow-200',
  ARRAY['image_id', 'building_name', 'architect', 'year_built', 'materials'],
  'IMG_2025_CMU_WeanHall.jpg, Wean Hall, Yount & Sullivan, 1971, [concrete, steel]',
  'All photos shot professionally in RAW format, available upon request.'
FROM profiles
LIMIT 1;

INSERT INTO datasets (creator_id, title, description, tags, price, modality, accent_color, schema_fields, sample_data, notes)
SELECT 
  id,
  'Audio Library of Antique Mechanical Keyboards',
  '50 unique recordings of rare mechanical keyboards, from the IBM Model M to the Alps ''Bigfoot''. Each keypress is isolated.',
  ARRAY['audio', 'niche', 'vintage tech'],
  79,
  'audio',
  'bg-cyan-200',
  ARRAY['keyboard_model', 'switch_type', 'year', 'sound_file'],
  'IBM Model M, Buckling Spring, 1986, ibm_model_m_typing.wav',
  'Recorded with a Neumann U 87 Ai microphone in a soundproofed environment.'
FROM profiles
LIMIT 1;

INSERT INTO datasets (creator_id, title, description, tags, price, modality, accent_color, schema_fields, sample_data, notes)
SELECT 
  id,
  'A Lexicon of 1980s Skateboarder Slang',
  'A curated text file of over 1,500 slang terms used by skateboarders in the 1980s, with definitions and examples.',
  ARRAY['text', 'nlp', 'subculture'],
  59,
  'text',
  'bg-pink-200',
  ARRAY['term', 'definition', 'example_sentence', 'region'],
  'rad, adj., an expression of approval, ''That new Vision board is so rad.''',
  'Compiled from original source material like Thrasher Magazine and skate videos from the era.'
FROM profiles
LIMIT 1;

INSERT INTO datasets (creator_id, title, description, tags, price, modality, accent_color, schema_fields, sample_data, notes)
SELECT 
  id,
  '50k Urban Street-Sign Images (COCO-annotated)',
  'Multi-city, day/night, weather-varied dataset for robust object detection models that need real-world grit.',
  ARRAY['vision', 'coco', 'detection'],
  129,
  'vision',
  'bg-yellow-200',
  ARRAY['image_id', 'bbox', 'class', 'city', 'lighting', 'weather'],
  'img_10444.jpg, [231,44,88,88], STOP, Austin, night, clear',
  'Privacy-compliant with blurred faces and obfuscated license plates.'
FROM profiles
LIMIT 1;

INSERT INTO datasets (creator_id, title, description, tags, price, modality, accent_color, schema_fields, sample_data, notes)
SELECT 
  id,
  'Encyclopedia of North American Diner Pancakes',
  '5,000+ images of pancakes from diners across the US & Canada, annotated for fluffiness, toppings, and plate aesthetics.',
  ARRAY['vision', 'food', 'niche'],
  119,
  'vision',
  'bg-yellow-200',
  ARRAY['image_id', 'diner_name', 'city', 'fluffiness_score', 'toppings'],
  'pancake_001.jpg, Lou''s Diner, Pittsburgh, PA, 8.5, [butter, syrup]',
  'Every pancake tells a story. No waffles allowed.'
FROM profiles
LIMIT 1;

INSERT INTO datasets (creator_id, title, description, tags, price, modality, accent_color, schema_fields, sample_data, notes)
SELECT 
  id,
  '8k Household Actions (Video Clips, 1080p)',
  'Short clips of everyday actions (open fridge, pour water). Essential for training embodied AI and robotics.',
  ARRAY['video', 'actions', 'robotics'],
  149,
  'video',
  'bg-yellow-200',
  ARRAY['video_id', 'start_frame', 'end_frame', 'verb_class', 'objects_present'],
  'vid_2021.mp4, 93, 171, pour_water, [pitcher, glass]',
  'Includes camera pose data for a subset of clips, enabling 3D analysis.'
FROM profiles
LIMIT 1;

-- Insert sample bounties
INSERT INTO bounties (creator_id, title, description, modality, quantity, budget, status)
SELECT 
  id,
  'Recordings of Different Types of Rain',
  'Need high-quality audio recordings of various types of rain: light drizzle, heavy downpour, thunderstorm, etc.',
  'audio',
  '5 hours',
  250,
  'active'
FROM profiles
LIMIT 1;

INSERT INTO bounties (creator_id, title, description, modality, quantity, budget, status)
SELECT 
  id,
  'Positive Customer Support Chat Logs',
  'Looking for transcripts of positive customer support interactions for training sentiment analysis models.',
  'text',
  '10,000 lines',
  800,
  'active'
FROM profiles
LIMIT 1;

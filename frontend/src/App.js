import React, { useState, useEffect, useRef, useCallback } from "react";
import "@/App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Checkout Success Component
const CheckoutSuccess = ({ onBackToShop }) => {
  const [status, setStatus] = useState("checking");
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [downloadLinks, setDownloadLinks] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;

  const fetchDownloadLinks = async (sessionId) => {
    try {
      const response = await axios.get(`${API}/download/${sessionId}`);
      setDownloadLinks(response.data);
    } catch (error) {
      console.log("No download links available (physical product)");
    }
  };

  const checkPaymentStatus = useCallback(async (sessionId) => {
    try {
      const response = await axios.get(`${API}/checkout/status/${sessionId}`);
      const data = response.data;
      
      if (data.payment_status === "paid") {
        setStatus("success");
        setPaymentInfo(data);
        // Try to get download links for digital products
        fetchDownloadLinks(sessionId);
      } else if (data.status === "expired") {
        setStatus("expired");
      } else if (attempts < maxAttempts) {
        setAttempts(prev => prev + 1);
        setTimeout(() => checkPaymentStatus(sessionId), 2000);
      } else {
        setStatus("pending");
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      setStatus("error");
    }
  }, [attempts]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    
    if (sessionId) {
      checkPaymentStatus(sessionId);
    } else {
      setStatus("error");
    }
  }, [checkPaymentStatus]);

  return (
    <div className="checkout-success-page" data-testid="checkout-success">
      <div className="checkout-success-content">
        {status === "checking" && (
          <>
            <div className="checkout-spinner"></div>
            <h2>Processing your payment...</h2>
            <p>Please wait while we confirm your purchase.</p>
          </>
        )}
        
        {status === "success" && (
          <>
            <div className="checkout-icon success">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2>Thank You for Your Purchase!</h2>
            <p>Your order has been confirmed and is being processed.</p>
            {paymentInfo && (
              <p className="payment-amount">
                Amount: ${(paymentInfo.amount_total / 100).toFixed(2)} {paymentInfo.currency?.toUpperCase()}
              </p>
            )}
            
            {downloadLinks && downloadLinks.downloads && downloadLinks.downloads.length > 0 && (
              <div className="download-section">
                <h3>Your Downloads</h3>
                <p className="download-note">Click below to download your files:</p>
                <div className="download-list">
                  {downloadLinks.downloads.map((file, index) => (
                    <a 
                      key={index}
                      href={file.url}
                      download={file.filename}
                      className="download-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      {file.filename.replace(/_/g, ' ').replace('.wav', '')}
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {!downloadLinks && (
              <p className="payment-note">You will receive a confirmation email shortly.</p>
            )}
          </>
        )}
        
        {status === "pending" && (
          <>
            <div className="checkout-icon pending">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h2>Payment Processing</h2>
            <p>Your payment is still being processed. Please check your email for confirmation.</p>
          </>
        )}
        
        {status === "expired" && (
          <>
            <div className="checkout-icon error">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h2>Session Expired</h2>
            <p>Your payment session has expired. Please try again.</p>
          </>
        )}
        
        {status === "error" && (
          <>
            <div className="checkout-icon error">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h2>Something Went Wrong</h2>
            <p>We couldn't verify your payment. Please contact support if you were charged.</p>
          </>
        )}
        
        <button className="back-to-shop-btn" onClick={onBackToShop} data-testid="back-to-shop">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Shop
        </button>
      </div>
    </div>
  );
};

// Image URLs from the live site
const IMAGES = {
  hero: "https://tune-stage.preview.emergentagent.com/api/uploads/images/f1c2950b-a4c0-46cd-9180-0511a19ff3ed.jpg",
  album: "https://customer-assets.emergentagent.com/job_helper-upload-issue/artifacts/unc8lw89_Darko%20%26%20Sophia%20-%20Cover%20Art%20%28PNG3%29.jpg",
  erich: "https://customer-assets.emergentagent.com/job_helper-upload-issue/artifacts/jk04fq3e_2.png",
  arica: "https://customer-assets.emergentagent.com/job_helper-upload-issue/artifacts/duduele8_Arica%20Western%20Doorway%20looking%20down.jpg"
};

// Video URL for hero background - blue sky with moving clouds
const HERO_VIDEO = `${BACKEND_URL}/api/uploads/sky_video.mp4`;

// Track data
const TRACKS = [
  { 
    number: 1, 
    title: "GARDEN AFTER THE STORM", 
    duration: "5:23", 
    file: "track_01_garden_after_the_storm.wav",
    description: `Created in collaboration with the wonderfully talented, Arica Hilton (IG: @aricahilton), whose lovely poetry inspired the song – I feel extremely fortunate she allowed me to put her poetic vision to music – meant, not just to be heard, but also to be felt.

"Garden After the Storm" is a cinematic piano ballad about transformation after trauma. The song reflects on the choice between carrying the darkness we've experienced and allowing it to dissolve into something new. Moving from broken rooms and quiet fear toward healing and growth, the story follows the idea that scars can become gardens if we choose to nurture what comes after the storm. With intimate verses and a powerful emotional chorus, the song explores resilience, forgiveness, and the quiet strength of letting the past drift away.`,
    lyrics: `Garden After the Storm

Unlike you
I don't stay in the dark
The quiet hunger for damage

It's not that I don't feel it too
Those shadows cross my mind
But I let them drift like smoke
And leave them far behind

You might think I'm two people
Storms beneath a smile
Hiding ghosts in gentle words
For just a little while

Soft thoughts drifting outward
Hands that still care
Choosing light instead of fear
Choosing open air

Why bring back the broken rooms
The helplessness, the fear
Why give breath to yesterday
When the sky is here

Let the past fall into air
Like dust across the sea
Let the night release its hold
And loosen up on me

What was heavy fades away
What was sharp grows soft again
Like the sand that shifts each morning
With the turning of the wind

Maybe I tried to wash it out
Exfoliate the mind
Like a judge who clears the name
Of someone left behind

But are we ever helpless
Do we have to kneel to shame
For the violence we have witnessed
Or the scars we cannot name

Why give life to broken echoes
Why relive the fall
When the sky is wide above us
And the light is calling all

Let the past fall into air
Like dust across the sea
Let the night release its hold
And loosen up on me

What was heavy fades away
What was sharp grows soft again
Like the sand that shifts each morning
With the turning of the wind

A drunken storm broke through the door
Walls shattered on the floor
Blood and bruises in the room
Silence at the core

A child climbed out the window
Searching sky for breath
Running toward a life beyond
The wreckage left by death

But somewhere past that violent night
A garden slowly grew
Flowers rising in the sun
Breaking morning through

She washed the dust from every leaf
Every petal clean
Let the darkness fall away
From everything that's green

Let the past fall into air
Like dust across the sea
Let the night release its hold
And loosen up on me

What once marked me like a tattoo
Fades into the wind
Every scar becomes a garden
If you choose to begin

The sand rearranges
Day after day
And pain changes shape
When it drifts away

She washed herself of other people's tragedies
As she washed the parasites from each leaf – every petal
As they try to feed
The way humans sometimes do to one another`
  },
  { 
    number: 2, 
    title: "I HEARD AN OAK TREE", 
    duration: "7:48", 
    file: "track_02_i_heard_an_oak_tree.wav",
    description: `"I Heard an Oak Tree" continues the story that began in "Garden After the Storm." In the first song, the artist releases the weight of past wounds and learns to let pain dissolve into something new. In this sequel, they return to that same garden (now quiet after the storm) and hear something deeper beneath the silence.

An ancient oak tree becomes the voice of the earth itself, reminding the listener that the elements shaping mountains, oceans, and forests are the same elements that form us. Through hypnotic repetition and atmospheric soundscapes, the song moves from personal healing to a broader realization: that we are not separate from the world around us. The storm may pass, but what remains is belonging.

The oak tree laments, "I was here before you, rooted, like you, reaching, like you."

These songs are meant to be experienced as a journey rather than isolated tracks. Garden After the Storm begins with emotional release: the quiet aftermath of turmoil and the first breath of healing. I Heard an Oak Tree moves into reflection, where the listener pauses in that stillness and begins to hear the deeper rhythms of the earth and of oneself.`,
    lyrics: `I Heard an Oak Tree

I heard
An oak tree
(oak tree… oak tree…)
And it was in a garden
After the storm
I heard that sound
A deep groan
Like a bass note
Searching for the root
(root… root…)

I heard a collision
Like hands pushing aside dirt
Clearing a path for light
Pouring into the center
Of the earth

We belong to the same sun
We belong to the same earth
Elements forming you
Elements forming me

I heard a chord
Echoing rumors of sunsets
Kissing a canopy of trees
And rain streaming life
Into your limbs
(life… life…)

We belong
(we belong … we belong…)
We belong
To the same sun
To the same earth
I heard…
(oak tree…)
I heard an oak tree
(oak tree… oak tree…)

We belong
We belong
Elements forming you
Elements forming me

With the window open
The way you like to sleep
I heard an oak tree
Lamenting in the breeze
Standing in the garden
After the storm

I was here before you
(before you… before you…)

Rooted
Like you
(like you… like you…)
Reaching
Like you

Mountains
Oceans
Trees
All the elements
Forming you
Forming me

We belong to the same sun
We belong to the same earth
We belong to the same stars
We belong to the same birth
We belong to the same wind
We belong to the same sea
Elements forming you
Elements forming me

And in the garden
After the storm
I heard an oak tree
(oak tree… oak tree…)
And it whispered
You were never separate
From me

I heard…
(oak tree… oak tree…)
An oak tree
(oak tree… oak tree…)
Calling through the wind
We belong
To the same sun
To the same earth
Elements forming you
Elements forming me

And in the garden
After the storm
I heard an oak tree
(oak tree… oak tree…)
And it whispered
You were never separate
From me
(from me… from me…)`
  },
  { 
    number: 3, 
    title: "SUNSTORM OF PASSION", 
    duration: "5:48", 
    file: "track_03_sunstorm_of_passion.wav",
    description: `"Sunstorm of Passion" is a sensual cinematic piano ballad about surrendering to a love that feels inevitable and cosmic. Set in a candlelit room filled with the scent of jasmine, the song unfolds like a storm slowly gathering in the sky: quiet longing building into overwhelming passion.

Through imagery of galaxies, moonlit whispers, and clouds heavy with rain, the singer describes the intoxicating pull of desire that leaves no room for resistance. What begins as a delicate atmosphere of fragrance and distant poetry gradually becomes a powerful emotional storm: one that consumes both body and soul.

As the music swells with orchestral intensity, the song captures the moment when control dissolves and two people give themselves fully to the gravity between them. In the end, the storm quiets into a whisper, leaving only breath, memory, and the lingering echo of passion in the air.`,
    lyrics: `Sunstorm of Passion

The sky was wide and waiting before the storm tonight
Jasmine rising softly in the night
Candlelight trembling on the air
Like a dream already there

Poems of eternal love drift through the distance
Jasmine rising in the air
There is no escaping this scent tonight
It pulls me under everywhere

Your breath moves slowly over me
Like gravity pulling the sea
This fragrance turns the world around
Until it spins to vertigo

Pressure building everywhere
Thunder moving through the air
Every second drawing closer to the flame

And suddenly the sky ignites

Oh —

There's your sunstorm of passion rising through me tonight, tonight
Like a fire in the dark reaching up for the light
Every wave of you pulls me deeper below
Every heartbeat saying don't let go

And I know I should run but I'm losing control
Every breath pulling deeper my soul
There's your sunstorm of passion raging out of control
You're the fire I can't let go

Moonlit branches trembling overhead
Drunken clouds spinning into drunkenness
Until they can no longer hold their liquid sky
Silver threads begin to unfold

What is this twittering in the moonlight
Calling softly through the night
Signaling something I cannot refuse
Free will quietly surrendering

Every breath becoming flame
Every whisper speaks your name
Every second drawing closer to the fire

And suddenly the sky ignites

Oh —

There's your sunstorm of passion rising through me tonight, tonight
Like a fire in the dark reaching up for the light
Every wave of you pulls me deeper below
Every heartbeat saying don't let go

And I know I should run but I'm losing control
Every breath pulling deeper my soul
There's your sunstorm of passion I could never outrun
You're the storm I've become

We were stars in a golden cage of galaxies
Living somewhere between radiance and mystery
I tried to hold the fire, but the fire held me
And the storm only grows stronger every day

Now the sky remembers every spark of your name
And the night keeps whispering the same
That a love like ours was never meant to fade
Just a flame we were born to become

And in the silence…
The storm explodes

Oh —

There's your sunstorm of passion rising through me tonight, tonight
Like a fire in the dark reaching up for the light
Every wave of you pulls deeper the tide
Every breath draws you deeper inside

And I know I should run but it's already done
You're the storm, the fire, the only one
Rising like a sunstorm of passion deep in my soul
You're the fire I can't let go

The sky is burning in the candlelight
Jasmine fading softly into night
And somewhere in the air we breathe again
Your sunstorm still remains

You lapping it up

 I, waiting for your waves…

 to etch my perfection.`
  },
  { 
    number: 4, 
    title: "DEEPER THAN LOVE", 
    duration: "5:23", 
    file: "track_04_deeper_than_love.wav",
    description: `"Deeper Than Love" is a sensual, mystical Buddha Bar–style lounge track that explores the idea that some connections transcend time, memory, and even identity. Wrapped in a slow, hypnotic groove of deep bass, atmospheric pads, and delicate world instrumentation, the song unfolds like a whispered meditation on cosmic reunion.

Through imagery of roots stretching across oceans, ancient branches bearing fruit, and stardust scattering into hope, the lyrics suggest that two souls are not meeting for the first time, but rediscovering each other after lifetimes of wandering. The kiss at the center of the song becomes symbolic: less a moment of passion than a recognition of something eternal that has always existed beneath the surface.

The result is a lush, late-night lounge experience: atmospheric, sensual, and contemplative, evoking the feeling of two wanderers finally realizing they have arrived home in one another.

"You think you are meeting for the first time
But you realize you are the wanderer
who finally found home.

This is deeper than love, my love."`,
    lyrics: `Deeper Than Love

This is deeper than love…
my love.

A fusion
of what was once one.

Roots stretching across oceans
longing for the other shore.

Ancient branches press my lips
revealing fruits of endless form.

Possibilities unfolding slowly
heavy with the knowledge of time.

Like liquid gold
your body settles into my bones…

As if I were a vessel
for your thirst. All my life
I have been searching for this kiss.

All my life
for a moment like this.

This is deeper than love, my love…

Deeper than love.
deeper than love.

For a thousand years
my atoms grew into branches.

Leaves burst into being
in a second…

or a century.

Who is to say?

On the surge of pilgrimage
my voice glides across the loam.

Planting your lineage
in the soil of memory.

Remnants of starburst
flare into particles of hope.

All my life
I have been searching for this kiss.

All my life
for a moment like this.

This is deeper than love, my love…

Deeper than love.
deeper than love.

You think we are meeting
for the first time…

But you realize
you are the wanderer

who finally
found home.

This is deeper than love…

my love.`
  },
  { 
    number: 5, 
    title: "RIVERS IN ME", 
    duration: "5:50", 
    file: "track_05_rivers_in_me.wav",
    description: `The central theme of "Rivers in Me" is emotional connection that runs deeper than words. It explores the idea that when two people truly connect, the experience feels like an unseen current moving beneath the surface: quiet but powerful, like rivers flowing through the night.

The imagery of rivers, stars, silence, and night represents inner emotions that are difficult to explain but deeply felt. The song suggests that love or connection is not always loud or dramatic; sometimes it appears in quiet moments of shared understanding, reflection, and presence.

At its core, the theme is about surrendering to that emotional current: allowing yourself to feel something profound and transformative, even if it cannot be fully expressed in language. The repeated phrase about "rivers" becomes a metaphor for the flow of feeling, memory, and intimacy moving through both people at once.`
  },
  { 
    number: 6, 
    title: "THE MUSIC OF OUR BECOMING", 
    duration: "5:21", 
    file: "track_06_the_music_of_our_becoming.wav",
    description: `"The Music of Our Becoming" is written as a metaphorically complex poem vs. a structured song. This piece centers on reunion, rebirth, and the sacred intensity of rediscovered love. It portrays two lovers returning to one another not merely as continuation, but as transformation: shedding distance, restraint, and fear to become something deeper and newly awakened.

At its core, the theme is relief and renewal: love surviving exile and emerging not diminished, but purified and reborn through longing and return. Metaphors draw from René Magritte's "The Lovers," which symbolizes the frustration of desire.`
  },
  { 
    number: 7, 
    title: "DISTANCE", 
    duration: "6:15", 
    file: "track_07_distance.wav",
    description: `"Distance" is a haunting meditation on the unbearable space that grows between two people who were once inseparable. The song traces the arc of a love that burned with fire and marrow, only to be slowly claimed by the quiet devastation of distance.

Through rich, poetic imagery—flames of blue, drifting continents, trembling bridges—the piece explores how even the most passionate connections can fracture into silence. The recurring question "How is it then distance came to claim us?" echoes like a lament, searching for meaning in separation.`,
    lyrics: `Distance

And then
came longing

When distance
poured a fire into my flesh
Flinging flames of blue
through the wind
My heart flowed like a brook once
Beating in cadence
to your rolling ocean
Tears falling into your tears
Splashing into deserted pools of laughter
So close were we

My breath inhaled your marrow
Melting into unison

How is it then
distance came to claim us?
Distance came to claim us
Pulling its rope
harder and farther
Across that feeble bridge
connecting the cord
of our drifting continents
We were fire in the same breath
Now we fracture into silence

And you
could taste the lexicon
of my hunger
With a litany of kisses
Cascading endlessly
through languid lips
We were spilling into moments
we could not contain
Time folding around us
like a forgotten name

Your caprice found no welcome
As I spread the salt
of your prodigal oaths
A remedy
for my raw
and ashen pride

How is it then
distance came to claim us?
Distance came to claim us
Drawing its line
through marrow and flame
Across that trembling bridge
binding what could not remain
We were music in the same breath
Now we echo in the ache

Distance
was waiting
In the fracture
of timing
In the pull
of the thread
In the staccato
of our longing
In the words
we never said

How is it then
distance came to take us?
Distance came to take us
Unraveling quietly
all we became
There was fire in the marrow
There was breath we couldn't follow
Across the fragile bridge
we could not sustain
We were one in the same breath
I still feel you
Now the silence screams your name

And all along
distance
was wise
to our staccato embrace`
  },
  { 
    number: 8, 
    title: "THE SAME MOON BETWEEN US", 
    duration: "5:45", 
    file: "track_08_same_moon_between_us.wav",
    description: `"The Same Moon Between Us" explores the bittersweet beauty of connection across distance. Though separated by miles, the lovers find solace in the shared light of the moon—a celestial reminder that they remain bound by something greater than space.`
  },
  { 
    number: 9, 
    title: "SEVEN FACES OF LOVE", 
    duration: "8:02", 
    file: "track_09_seven_faces_of_love.wav",
    description: `"Seven Faces of Love" is an epic, cinematic journey through ancient mythology and timeless desire. The song weaves together imagery of the Seven Wonders of the World with the seven veils of Salome, creating a tapestry of longing, discovery, and transformation.

Set in a "faraway land" and "faraway time," the narrator speaks of a hidden cache—a heart locked away, waiting to be unearthed. Through archaeological metaphors of shovels and buried coffers, the song explores the risk of excavating deep emotion: the danger and beauty of revealing what has been buried beneath "millennia" of protection.

The lyrics dance between surrender and fear, between the call of sirens and the terror of oblivion. Yet ultimately, the song is a celebration of love's power to release us from our tombs, to awaken the absent colors in our world, and to transform fear into freedom.`,
    lyrics: `Seven Faces of Love

In a faraway land
In a faraway time
Discovery led to a faraway cache

A cache unopened
A cache unnoticed

A cache locked away in a faraway heart
A heart locked away in a faraway land.
Seven faces of love…

I did not seek to fall.
Nor did I seek your kiss.

Your youth beguiled me
luring me like the call of sirens
to the ancient abyss of your sea.

I ask you, shovel in hand

should we risk digging
into the coffers buried -- buried within?

Brush away millennia
to reveal naked desire

worn, dismantled

raging in whispers beneath the
cleavage of seedless sands.

The science of love
all but threw its elements
before our feet.

But what elements comprised our fears?

Was it your silence
thundering on traffic roads
that halted my fleeing heart?

Or your dangerous kisses
engraving gold into my flesh

from which there is no carved road
of return?

I will dance each of the seven veils
one for each of your seven faces

Facing each of your seven wonders
Brushing each of your burning layers

of your pomegranate sweetness

awakening the absent colors
in the seven wonders of your world.

Seven faces of love
Seven veils of fire
Seven faces of love
Seven hearts of desire

Fear encases me in a tomb.

How do we walk, surefooted now
through rocky slopes without slipping
into the torso of oblivion?

Bypass the dragon smoke
armed about our ankles

primed to trip the tide of trepidation
in an effort to retrieve our squandered souls.

I will dance before Zeus at Olympia
glide through Colossus of Rhodes

hang in the gardens of Babylon

kneel before Artemis' temple

I will pray at Bodrum

seek Alexandria's beacon

travel south

to build the grandest pyramid
Egypt ever bore.

All in the name of your faces
All in the name of your love

Your seven faces of love.

I will dance each of the seven veils
one for each of your seven faces

Facing each of your seven wonders

Brushing each of your burning layers

of your pomegranate sweetness.

Seven faces of love
Seven faces of love
Seven veils of fire
Seven faces of love
Seven hearts of desire
 
Peace nails shut the voice.

The voice of the sirens silent
silent beneath the eyelids
the eyelids of the sea.

And the only voice I hear
will be the voice of your pomegranate sweetness.

Fear releases me from my tomb.

The sun awakens the moon.

As the faraway land draws near
when the faraway time has come
to withdraw its cache of tears.

All in the name of your faces
All in the name of your love

Your seven faces of love.`
  },
  { 
    number: 10, 
    title: "NOMEN EXSPECTANS", 
    duration: "6:10", 
    file: "track_10_nomen_exspectans.wav",
    description: `"Nomen Exspectans" (Latin for "Waiting to be Named") is a mystical meditation on identity, transformation, and cosmic connection. Opening with lines from the ancient Emerald Tablet of Hermes Trismegistus—"As above, so below"—the song weaves alchemical wisdom with dreamlike imagery of hunters catching stars, wings melting into fins, and souls walking up the sky.

The narrator contemplates whether the Emerald Tablet represents true transformation or merely the reflection of a mythic man who found himself in the stars. Ultimately, they embrace the mystery, choosing to simply "walk up the sky like a star, waiting to be named by my discoverer."`,
    lyrics: `Nomen Exspectans

Verum, sine Mendacio, certum et verissimum.
Quod est Superius est sicut quod est Inferius.
Et quod est Inferius est sicut quod est Superius,
Ad perpetranda Miracula Rei Unius.
 
A hunter with a big net
Catches stars falling from the Milky Way.
He keeps them in a basket full of moons
Circling love like the seasons.
 
As you weave the threads of sunrise
Like a waking wave of kisses
Skipping the stones of my heart
And rippling through my flesh
As only the horns of heaven can.
 
You, outlined in fireflies,
Watch the moon filling, fulfilling…
Strumming the sun into prose.
 
A man flies into an ocean, feet first.
His wings melt into fins,
Neck stretching skyward, like a swan's.
 
In truth, certainly, most veritable,
As above, as below.
 
I can't decide if the Emerald Tablet
Is his ticket to transformation
Or just the whim of a mythic man
Who discovered his reflection in Orion.
 
I simply walk up the sky
Like a star
Waiting to be named
By my discoverer.
 
As above…
So below…`
  },
  { 
    number: 11, 
    title: "SONG OF THE GYPSY", 
    duration: "6:25", 
    file: "track_11_song_of_the_gypsy.wav",
    description: `"Song of the Gypsy" traces the memory of a love that was once visceral, intoxicating, and deeply intertwined: felt through scent, touch, and shared thought. What begins as a sensory immersion (fruit, skin, breath, late-night intimacy) slowly unravels into distance and unanswered longing.

The piece reflects on the quiet fracture that follows intensity: unspoken words, fading presence, and the disorientation of absence. Yet even in separation, the connection lingers: echoing through memory, rhythm, and the body itself.

It is a meditation (yet fun, repeatable and danceable) on desire, impermanence, and the way certain encounters continue to move through us long after they've disappeared.`,
    lyrics: `Song of the Gypsy

Recuerdas…
estábamos ahí…
una vez…
amor… tela recién cortada…

Remember… we were there once
Love was a new cut of cloth

The smell of fresh fruit
We fell into each other's arms
An anxious sigh

A kiss… two keys…
A heart that beat like mine
And I was wrong

I dreamed of honeydew nights
Satin sheets
Grapes half eaten

Dónde estás…
dime dónde estás…
Fuiste fuego en mi piel…
y pensé que eras mío

Dónde estás…
vuelve una vez más…
Sigo ardiendo en silencio…
pensando en ti

Your scent moves softly through my hands
A rough cheek cuts across my breast
Unheard apologies
Left on my machine

Where are you now?
The one whose hunger ran through me
Your branches running in my veins

You poured your promises in my cup
My honey hardened still
Into stone

Lo sentiste…
pero no te quedaste…
 
The guitar strums… our final line
Reluctant memories fall away

The wind blows east
My eyes set west
My heart still burns
For what we pierced

An August moon… urgent

Dónde estás…
dime dónde estás…
Fuiste fuego en mi piel…
y ya no estás

Dónde estás…
vuelve una vez más…
Bailo sola en la noche…
pensando en ti

Dónde estás…

We whispered poetry. discovered Neruda.
debated on poverty and the wealth of nations
whatever happened to the half-bitten oaths?
the sunrise. shielded by clouds
distort your ecstasy. as I drive to a movie alone
in placid countenance…  
 
replenishing my roving vessel with a moving song of the gypsy.`
  }
];

// Chat Widget Component
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "Welcome to Garden After the Storm! 🎵 I'm here to help you explore the album, learn about the artists Erich Fritz and Arica Hilton, or answer any questions. You can also share images or videos with me! How can I help you today?"
      }]);
    }
  }, [isOpen, messages.length]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert("File size must be less than 50MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const cancelFileSelection = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const response = await axios.post(`${API}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });
      setIsUploading(false);
      return response.data;
    } catch (error) {
      setIsUploading(false);
      throw error;
    }
  };

  const sendMessage = async () => {
    if ((!inputText.trim() && !selectedFile) || isLoading) return;

    let fileData = null;
    
    // Upload file first if selected
    if (selectedFile) {
      try {
        fileData = await uploadFile(selectedFile);
      } catch (error) {
        console.error("Upload failed:", error);
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "Sorry, I couldn't upload your file. Please try again."
        }]);
        cancelFileSelection();
        return;
      }
    }

    const userMessage = {
      role: "user",
      content: inputText || (selectedFile ? `Shared a file: ${selectedFile.name}` : ""),
      file: fileData ? {
        url: fileData.url,
        type: fileData.file_type,
        name: fileData.file_name
      } : null
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    cancelFileSelection();
    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        session_id: sessionId,
        message: userMessage.content,
        file_url: fileData?.url,
        file_type: fileData?.file_type,
        file_name: fileData?.file_name
      });

      setMessages(prev => [...prev, {
        role: "assistant",
        content: response.data.response
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I'm having trouble responding right now. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        data-testid="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="chat-toggle-btn"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window" data-testid="chat-window">
          <div className="chat-header">
            <span>Garden After the Storm Assistant</span>
            <button onClick={() => setIsOpen(false)} className="chat-close-btn" data-testid="chat-close-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="chat-messages" data-testid="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                {msg.file && msg.file.type === "image" && (
                  <img src={`${BACKEND_URL}${msg.file.url}`} alt={msg.file.name} className="chat-file-preview" />
                )}
                {msg.file && msg.file.type === "video" && (
                  <video src={`${BACKEND_URL}${msg.file.url}`} controls className="chat-file-preview" />
                )}
                {msg.file && !["image", "video"].includes(msg.file.type) && (
                  <div className="chat-file-attachment">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <span>{msg.file.name}</span>
                  </div>
                )}
                <p>{msg.content}</p>
              </div>
            ))}
            {isLoading && (
              <div className="chat-message assistant">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* File Preview */}
          {selectedFile && (
            <div className="file-preview-bar" data-testid="file-preview">
              <div className="file-preview-info">
                {selectedFile.type.startsWith("image/") ? (
                  <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="file-thumbnail" />
                ) : selectedFile.type.startsWith("video/") ? (
                  <div className="file-thumbnail video-thumb">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </div>
                ) : (
                  <div className="file-thumbnail doc-thumb">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    </svg>
                  </div>
                )}
                <span className="file-name">{selectedFile.name}</span>
              </div>
              {isUploading ? (
                <div className="upload-progress">
                  <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                  <span>{uploadProgress}%</span>
                </div>
              ) : (
                <button onClick={cancelFileSelection} className="cancel-file-btn" data-testid="cancel-file-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              )}
            </div>
          )}

          <div className="chat-input-container">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*,.pdf,.txt,.csv"
              style={{ display: "none" }}
              data-testid="file-input"
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="attach-btn"
              disabled={isLoading || isUploading}
              data-testid="attach-file-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isLoading || isUploading}
              data-testid="chat-input"
            />
            <button 
              onClick={sendMessage} 
              disabled={(!inputText.trim() && !selectedFile) || isLoading || isUploading}
              className="send-btn"
              data-testid="send-message-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Merch data
const MERCH_ITEMS = [
  {
    id: 1,
    productId: "album_limited",
    category: "ALBUMS",
    title: "Limited Edition Album - Signed & Numbered",
    description: "A true collector's edition, limited to only 250 copies. This stunning gatefold album opens to reveal exclusive artwork and comes personally signed by Erich Fritz and Arica Hilton.",
    price: "$650.00",
    image: IMAGES.album
  },
  {
    id: 2,
    productId: "album_standard",
    category: "ALBUMS",
    title: "Garden After the Storm - Standard Edition",
    description: "Garden After the Storm on high-quality vinyl. 10 tracks of poetry and music through a journey of transformation, love, passion and ultimately peace.",
    price: "$44.99",
    image: IMAGES.album
  },
  {
    id: 3,
    productId: "book",
    category: "BOOKS",
    title: "Garden After the Storm 2026 - Poetry Book",
    description: "Limited Edition signed by the artist. This beautiful 8\" x 10\" paperback features the complete poetry collection from the album with stunning artwork.",
    price: "$50.00",
    image: `${BACKEND_URL}/api/uploads/book_cover.png`
  },
  {
    id: 4,
    productId: "digital_album",
    category: "DIGITAL",
    title: "Digital Album - Full Download",
    description: "Download the complete Garden After the Storm album in high-quality WAV format. Includes all 6 tracks plus exclusive digital artwork.",
    price: "$19.99",
    image: IMAGES.album,
    isDigital: true
  },
  {
    id: 5,
    productId: "digital_single_garden",
    category: "DIGITAL",
    title: "Garden After the Storm - Single",
    description: "Download the title track 'Garden After the Storm' in high-quality WAV format.",
    price: "$3.99",
    image: IMAGES.album,
    isDigital: true,
    trackFile: "track_01_garden_after_the_storm.wav"
  },
  {
    id: 6,
    productId: "digital_single_oak",
    category: "DIGITAL",
    title: "I Heard an Oak Tree - Single",
    description: "Download 'I Heard an Oak Tree' in high-quality WAV format.",
    price: "$3.99",
    image: IMAGES.album,
    isDigital: true,
    trackFile: "track_02_i_heard_an_oak_tree.wav"
  }
];

// Background Music URL - Garden After the Storm intro (38 sec) - processed version
const BACKGROUND_MUSIC = `${BACKEND_URL}/api/uploads/background_loop.mp3?v=processed`;

// Main App Component
function App() {
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState("");
  const [activeTrack, setActiveTrack] = useState(null);
  const [lyricsTrack, setLyricsTrack] = useState(null);
  const [merchFilter, setMerchFilter] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [bgMusicPlaying, setBgMusicPlaying] = useState(false);
  const bgMusicRef = useRef(null);

  // Check if returning from Stripe checkout
  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/checkout/success" || window.location.search.includes("session_id")) {
      setShowCheckoutSuccess(true);
    }
  }, []);

  const handleBackToShop = () => {
    // Clear URL parameters and go back to main page
    window.history.replaceState({}, document.title, "/");
    setShowCheckoutSuccess(false);
    setTimeout(() => {
      document.getElementById("merch")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Show checkout success page if returning from Stripe
  if (showCheckoutSuccess) {
    return <CheckoutSuccess onBackToShop={handleBackToShop} />;
  }

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    try {
      await axios.post(`${API}/subscribe`, { email });
      setSubscribeStatus("success");
      setEmail("");
    } catch (error) {
      setSubscribeStatus("error");
    }
  };

  const handleBuyNow = async (productId) => {
    setCheckoutLoading(productId);
    try {
      const originUrl = window.location.origin;
      const response = await axios.post(`${API}/checkout/create`, {
        product_id: productId,
        origin_url: originUrl
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Unable to process checkout. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="app" data-testid="app-container">
      {/* Navigation */}
      <nav className="nav" data-testid="main-nav">
        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          data-testid="mobile-menu-btn"
        >
          {mobileMenuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </button>
        <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <button onClick={() => scrollToSection("music")} data-testid="nav-music">MUSIC</button>
          <button onClick={() => scrollToSection("about")} data-testid="nav-about">ABOUT</button>
          <button onClick={() => scrollToSection("merch")} data-testid="nav-merch">MERCH</button>
          <button onClick={() => scrollToSection("links")} data-testid="nav-links">LINKS</button>
          <button onClick={() => scrollToSection("subscribe")} data-testid="nav-subscribe">SUBSCRIBE</button>
        </div>
        <div className="social-links-vertical">
          <a href="https://spotify.com" target="_blank" rel="noopener noreferrer" data-testid="social-spotify">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
          </a>
          <a href="https://music.apple.com" target="_blank" rel="noopener noreferrer" data-testid="social-apple-music">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.401-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.106 1.596-.35 2.295-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.042-1.785-.455-2.105-1.245-.238-.588-.212-1.183.066-1.75.263-.536.715-.893 1.27-1.105.307-.118.63-.19.95-.263.47-.108.946-.196 1.407-.328.25-.072.4-.214.41-.492.005-.06.003-.12.003-.18V8.203a.96.96 0 00-.022-.208c-.04-.16-.148-.253-.305-.262-.096-.006-.193.01-.29.023-1.136.156-2.27.312-3.406.47-1.06.148-2.12.294-3.18.442-.2.03-.312.126-.343.327-.01.065-.012.13-.012.195v7.74c0 .37-.047.736-.2 1.073-.283.62-.752 1.024-1.41 1.22-.35.106-.71.17-1.08.19-.94.048-1.768-.42-2.108-1.207-.248-.575-.225-1.16.033-1.728.246-.543.68-.907 1.22-1.12.32-.127.655-.204.99-.28.39-.09.784-.163 1.17-.266.295-.078.478-.262.494-.574.004-.06.002-.12.002-.18V7.124c0-.2.027-.394.09-.582.12-.357.374-.57.73-.635.166-.03.335-.05.503-.073 1.275-.174 2.55-.346 3.824-.52 1.27-.173 2.538-.348 3.808-.52.182-.024.364-.04.547-.038.356.005.608.2.705.54.044.153.06.313.06.472v3.348z"/></svg>
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" data-testid="social-youtube">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
          <a href="https://soundcloud.com" target="_blank" rel="noopener noreferrer" data-testid="social-soundcloud">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1zm-.899 1.125c-.051 0-.094.046-.101.1l-.158 1.029.158.984c.007.055.05.095.101.095.05 0 .09-.04.099-.095l.178-.984-.193-1.029c-.009-.06-.052-.1-.084-.1zm1.8-1.501c-.06 0-.105.05-.113.109l-.22 2.255.22 2.154c.008.06.053.11.113.11.059 0 .104-.05.112-.11l.249-2.154-.249-2.255c-.008-.059-.053-.109-.112-.109zm.899-.226c-.069 0-.121.058-.128.125l-.193 2.481.193 2.363c.007.067.059.125.128.125.068 0 .12-.058.127-.125l.218-2.363-.218-2.481c-.007-.067-.059-.125-.127-.125zm.9-.3c-.078 0-.136.066-.143.14l-.165 2.781.165 2.497c.007.074.065.14.143.14.077 0 .135-.066.142-.14l.188-2.497-.188-2.781c-.007-.074-.065-.14-.142-.14zm.899-.3c-.087 0-.152.074-.158.156l-.138 3.081.138 2.631c.006.083.071.157.158.157.086 0 .151-.074.157-.157l.156-2.631-.156-3.081c-.006-.082-.071-.156-.157-.156zm.9-.226c-.096 0-.166.082-.172.171l-.11 3.307.11 2.765c.006.09.076.172.172.172.095 0 .165-.082.171-.172l.124-2.765-.124-3.307c-.006-.089-.076-.171-.171-.171zm.899-.15c-.104 0-.181.09-.187.189l-.082 3.457.082 2.898c.006.098.083.188.187.188.103 0 .18-.09.186-.188l.093-2.898-.093-3.457c-.006-.099-.083-.189-.186-.189zm.901-.076c-.114 0-.196.099-.201.205l-.055 3.533.055 3.031c.005.107.087.205.201.205.113 0 .195-.098.2-.205l.062-3.031-.062-3.533c-.005-.106-.087-.205-.2-.205zm.898.025c-.123 0-.212.107-.216.221l-.027 3.508.027 3.165c.004.114.093.221.216.221.122 0 .211-.107.215-.221l.031-3.165-.031-3.508c-.004-.114-.093-.221-.215-.221zm2.65-1.576c-.323 0-.636.047-.932.134-.19-2.149-2.012-3.831-4.236-3.831-.575 0-1.138.119-1.654.344-.193.084-.245.17-.247.336v8.173c.003.17.142.308.313.32 0 0 6.719.007 6.756.007 1.318 0 2.386-1.065 2.386-2.379 0-1.314-1.068-2.38-2.386-2.38v.276z"/></svg>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" data-testid="social-instagram">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" data-testid="social-tiktok">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
          </a>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer" data-testid="social-twitter">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" data-testid="social-facebook">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" data-testid="hero-section">
        <video 
          className="hero-video" 
          autoPlay 
          loop 
          muted 
          playsInline
          preload="auto"
          poster={IMAGES.album}
          data-testid="hero-video"
          onCanPlay={(e) => e.target.play()}
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-content-wrapper">
          <div className="hero-album-cover" data-testid="hero-album-cover">
            <img src={IMAGES.album} alt="Garden After the Storm Album - Erich Fritz and Arica Hilton" />
          </div>
          <div className="hero-text">
            <p className="release-date">Album Release</p>
            <p className="release-date-value">10 April 2026</p>
            <button className="stream-btn" onClick={() => scrollToSection("music")} data-testid="stream-now-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Stream Now
            </button>
          </div>
        </div>
      </section>

      {/* Music Section */}
      <section id="music" className="music-section" data-testid="music-section">
        <p className="section-label">Now Available</p>
        <h2>Stream the Album</h2>
        
        <div className="album-container">
          <div className="album-cover">
            <img src={IMAGES.album} alt="Garden After the Storm Album Cover" data-testid="album-cover" />
          </div>
          <div className="album-info">
            <h3>Garden After the Storm</h3>
            <span className="album-year">2026</span>
            <p className="track-count">11 Tracks</p>
            
            <div className="track-list" data-testid="track-list">
              {TRACKS.map((track) => (
                <div 
                  key={track.number} 
                  className={`track ${activeTrack === track.number ? 'active' : ''}`}
                  data-testid={`track-${track.number}`}
                >
                  <div className="track-header" onClick={() => setActiveTrack(activeTrack === track.number ? null : track.number)}>
                    <span className="track-number">{track.number}</span>
                    <span className="track-title">{track.title}</span>
                    <span className="track-duration">{track.duration}</span>
                  </div>
                  {activeTrack === track.number && (
                    <div className="track-expanded">
                      <div className="track-player">
                        <audio 
                          controls 
                          controlsList="nodownload" 
                          src={`${BACKEND_URL}/api/uploads/${track.file}`}
                          onContextMenu={(e) => e.preventDefault()}
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                      <div className="track-actions">
                        {track.description && (
                          <button 
                            className="lyrics-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLyricsTrack(track);
                            }}
                            data-testid={`lyrics-btn-${track.number}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                            View Lyrics
                          </button>
                        )}
                        <button 
                          className="buy-track-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMerchFilter('DIGITAL');
                            document.getElementById('merch')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          data-testid={`buy-track-btn-${track.number}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          Buy Track
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section" data-testid="about-section">
        <p className="section-label">The Artists</p>
        <h2>About</h2>
        
        <div className="artists-grid">
          <div className="artist-card" data-testid="artist-erich">
            <div className="artist-img-wrapper">
              <img src={IMAGES.erich} alt="Erich Fritz" className="erich-photo" />
            </div>
            <h3>Erich Fritz</h3>
            <p>Erich Fritz, known musically as @darko_vaughn, is a composer, poet, and multidisciplinary creator whose work blends atmospheric electronic music with lyrical storytelling. His sound transforms poetry into cinematic sonic landscapes—melding spoken word, ambient textures, and progressive electronic rhythms to create music that feels both intimate and expansive.</p>
            <p>Drawing inspiration from Renaissance thinkers such as Leonardo da Vinci, Fritz approaches creativity through an interdisciplinary lens, merging analytical precision with emotional depth. His work often explores themes of love, transformation, memory, and renewal, turning written verse into immersive musical experiences.</p>
            <p>His latest collaboration marks the first release from the album "Garden After the Storm," a project built around the idea of poetry reborn through music. The album is part of a broader creative partnership that will also include original music for the television series "For the Love of Art."</p>
            <p>Outside of music, Fritz is the Founder and CEO of Fritz & Company, a technology-focused advisory firm. Prior to founding the firm, he spent more than a decade in investment banking advising technology companies and began his career as an electrical engineer working on advanced missile defense software at Northrop Grumman. He holds an MBA from the University of Chicago Booth School of Business, completed graduate coursework in applied mathematics at Johns Hopkins University's Applied Physics Laboratory, and earned his Bachelor's degree in Electrical Engineering from Penn State.</p>
            <p>Whether composing music, writing poetry, or building companies, Fritz embodies a modern Renaissance ethos—bringing together engineering, finance, and artistic expression into a singular creative voice.</p>
            <p>Follow @darko_vaughn to experience the evolving journey of Garden After the Storm and future collaborations.</p>
          </div>
          
          <div className="artist-card" data-testid="artist-arica">
            <div className="artist-img-wrapper">
              <img src={IMAGES.arica} alt="Arica Hilton" />
            </div>
            <h3>Arica Hilton</h3>
            <p>Arica Hilton (pen name Sophia Jolie) is a multidisciplinary artist, poet and global advocate whose life mission is to use her creativity to bring awareness to humanitarian and environmental issues that effect our world.</p>
            <p>In March 2026, Hilton collaborated with composer and poet, Erich Fritz (stage name @darko_vaughn) to create an album titled GARDEN AFTER THE STORM. Fritz wrote the music to Hilton's poetry. The complete album will be released late spring 2026.</p>
            <p>In the summer of 2024, Hilton's book of poetry "Let Me Tell You About Winds" was published by Dar Attakween, with an introduction by the perennial Nobel Prize nominated poet, Adonis (Ali Ahmad Said Esber). Adonis writes, "Wherever and whenever the reader enters Arica Hilton's world, he sees what he did not expect and must murmur with joy: It is poetry – a luminous explosion in the darkness of life, and it seems to be a language to make death die."</p>
            <p>In 2020, Hilton was invited to be the inaugural, lead artist-in-residence for Immersive Van Gogh Chicago where she created a body of work inspired by Vincent Van Gogh with an eco-conscious, contemporary twist.</p>
            <p>In 2019, she was honored as Greenheart International's Global Leader Honoree for her work as artist, curator and youth empowerment champion. Greenheart International is a global nonprofit that educates children to become global leaders. Previous Honorees include Nobel Peace Prize co-recipient Jerry White for his work on banning land mines and Hungarian scientist, philosopher and Nobel Prize nominee Dr. Ervin Laszlo.</p>
            <p>In 2018, Hilton traveled to the Indonesian archipelago of Raja Ampat in the Pacific Ocean as the artist on board to participate in the Elysium – Artists for the Coral Triangle Expedition. Sponsored by Ocean Geographic magazine, the expedition engaged artists, photographers scientists, musicians and writers to document threats to the extraordinary biodiversity of the Coral Triangle. Protection of the area from unsustainable fishing practices, over-exploitation and climate change is a global priority. She participated in the Elysium Epic exhibition in China with Time Magazine's Hero for the Planet, Dr. Sylvia Earle, along with the Ocean Geographic team of scientists, marine biologists, filmmakers and writers.</p>
            <p>In 2021, Hilton's art and poetry exhibit at BRUSHWOOD CENTER at RYERSON WOODS, "TIDES, A Prelude" emphasized NATURE as the driving force of the exhibition based on the gravitational pull of the sun and moon on the earth's bodies of waters. Exploring the spectrum of color, shape and frequency of sound, Hilton's paintings and poetry delved into the meaning of the TIDES in a direct and indirect menu of materials, both real and metaphorical.</p>
            <p>The former President of the Poetry Center of Chicago, Hilton created ARTS POETICA GLOBAL, whose mission is to include all creative endeavors, from the visual to the literary arts; dance, film, photography, music, architecture. Arts Poetica is a platform for global initiatives and philosophies that are presented in an imaginative and powerful way by contemporary thought leaders.</p>
            <p>Hilton has had numerous exhibitions in Europe, Asia and the United States. Her series, "I Flow Like Water," a body of works that highlight issues around water conservation and the problem of plastics weighing down our oceans, was exhibited at Art Dubai, Beirut Art Fair; QU ART in Brussels, Belgium; the Union League Club of Chicago; the Caux Forum for Just Governance and Human Security in Caux, Switzerland and in Beijing, Shanghai, Chengdu, China.</p>
            <p>Hilton is based in Chicago, where she is the Founder and CEO of Hilton Contemporary, a gallery platform she leverages to support internationally known artists and humanitarians who seek change for a better world.</p>
            <p><a href="https://www.aricahilton.com" target="_blank" rel="noopener noreferrer">www.aricahilton.com</a></p>
            <p>Instagram: <a href="https://www.instagram.com/aricahilton/" target="_blank" rel="noopener noreferrer">@aricahilton</a></p>
          </div>
        </div>

        <div className="story-section" data-testid="album-story">
          <h3>The Story Behind the Album</h3>
          <p>Erich Fritz and Arica Hilton met through their mutual love of art. Fritz is an art collector and Hilton is an artist and gallerist. The image on the cover of the album, Van Gogh's "Wheat fields with Cypresses" is especially meaningful because it was the work that brought them together. Fritz had purchased the Van Gogh "Wheatfields...." by artist Jeff Koons from his infamous Gazing Ball series long before they met. And ironically, Hilton was the inaugural artist-in-residence for Van Gogh Immersive in Chicago.</p>
          <p>One day Hilton sent Fritz her poem "Unlike You" (which is now transformed to Garden After the Storm) and he nonchalantly asked if he could put the poem to music. That was the beginning of their collaboration on a poetry/music album that resulted in an exercise in sleepless nights and their extreme dedication to perfection in all things they do.</p>
          <p>Contemporary polymaths, both artists also happen to be CEO's of their own companies, both are entrepreneurs and poets. Fritz studied electrical engineering and became a missile scientist studying applied mathematics and finance, AND went on to write music. Hilton studied architecture and is not only a poet, but an artist, designer, explorer and has worked with Nobel Prize winning authors and scientists.</p>
          <p>The Garden After the Storm album is their first collaboration.</p>
        </div>
      </section>

      {/* Merch Section */}
      <section id="merch" className="merch-section" data-testid="merch-section">
        <div className="merch-filters">
          <button 
            className={`merch-filter-btn ${merchFilter === 'all' ? 'active' : ''}`}
            onClick={() => setMerchFilter('all')}
            data-testid="merch-filter-all"
          >All</button>
          <button 
            className={`merch-filter-btn ${merchFilter === 'DIGITAL' ? 'active' : ''}`}
            onClick={() => setMerchFilter('DIGITAL')}
            data-testid="merch-filter-digital"
          >Digital</button>
          <button 
            className={`merch-filter-btn ${merchFilter === 'ALBUMS' ? 'active' : ''}`}
            onClick={() => setMerchFilter('ALBUMS')}
            data-testid="merch-filter-albums"
          >Albums</button>
          <button 
            className={`merch-filter-btn ${merchFilter === 'BOOKS' ? 'active' : ''}`}
            onClick={() => setMerchFilter('BOOKS')}
            data-testid="merch-filter-books"
          >Books</button>
        </div>
        
        <div className="merch-grid">
          {MERCH_ITEMS.filter(item => merchFilter === 'all' || item.category === merchFilter).map((item) => (
            <div className="merch-item" key={item.id} data-testid={`merch-item-${item.id}`}>
              <div className="merch-image-container">
                <span className={`merch-category-badge ${item.category.toLowerCase()}`}>{item.category}</span>
                <img src={item.image} alt={item.title} className="merch-image" />
              </div>
              <h3>{item.title}</h3>
              <p className="merch-description">{item.description}</p>
              <div className="merch-footer">
                <p className="merch-price">{item.price}</p>
                <button 
                  className={`merch-btn ${item.isDigital ? 'digital' : ''}`}
                  data-testid={`buy-btn-${item.id}`}
                  onClick={() => handleBuyNow(item.productId)}
                  disabled={checkoutLoading === item.productId}
                >
                  {checkoutLoading === item.productId ? (
                    <>Processing...</>
                  ) : item.isDigital ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Buy & Download
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="m1 1 4 4h16l-2 9H7"></path>
                      </svg>
                      Buy Now
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Links Section */}
      <section id="links" className="links-section" data-testid="links-section">
        <p className="section-label">Explore More</p>
        <h2>Links</h2>
        <p className="links-subtitle">Discover more about the artists and their work</p>
        
        <div className="website-links">
          <a href="https://aricahilton.com/" target="_blank" rel="noopener noreferrer" className="website-link-card" data-testid="link-arica">
            <div className="website-link-content">
              <h3>Arica Hilton</h3>
              <p>Official website of Arica Hilton - multidisciplinary artist, poet and global advocate</p>
              <span className="website-url">https://aricahilton.com/</span>
            </div>
            <svg className="external-link-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
          
          <a href="https://artspoetica.com/" target="_blank" rel="noopener noreferrer" className="website-link-card" data-testid="link-artspoetica">
            <div className="website-link-content">
              <h3>Arts Poetica Global</h3>
              <p>A platform for global initiatives and philosophies presented by contemporary thought leaders</p>
              <span className="website-url">https://artspoetica.com/</span>
            </div>
            <svg className="external-link-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      </section>

      {/* Subscribe Section */}
      <section id="subscribe" className="subscribe-section" data-testid="subscribe-section">
        <p className="section-label">Exclusive Access</p>
        <h2>GET BONUS TRACKS</h2>
        <p className="subscribe-description">Subscribe now and receive 2 exclusive bonus tracks from "Garden After the Storm" plus behind-the-scenes content.</p>
        
        <form onSubmit={handleSubscribe} className="subscribe-form" data-testid="subscribe-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            data-testid="subscribe-email-input"
          />
          <button type="submit" data-testid="subscribe-submit-btn">Subscribe</button>
        </form>
        
        {subscribeStatus === "success" && (
          <p className="subscribe-success" data-testid="subscribe-success">Thank you for subscribing!</p>
        )}
        {subscribeStatus === "error" && (
          <p className="subscribe-error" data-testid="subscribe-error">Something went wrong. Please try again.</p>
        )}
        
        <p className="privacy-note">We respect your privacy. Unsubscribe anytime.</p>
      </section>

      {/* Footer */}
      <footer className="footer" data-testid="footer">
      </footer>

      {/* Lyrics Slide-out Panel */}
      {lyricsTrack && (
        <div className="lyrics-overlay" onClick={() => setLyricsTrack(null)} data-testid="lyrics-overlay">
          <div className="lyrics-panel" onClick={(e) => e.stopPropagation()} data-testid="lyrics-panel">
            <button className="lyrics-close-btn" onClick={() => setLyricsTrack(null)} data-testid="lyrics-close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="lyrics-content">
              <span className="lyrics-track-number">Track {lyricsTrack.number}</span>
              <h2 className="lyrics-title">{lyricsTrack.title}</h2>
              
              {/* Description */}
              <div className="lyrics-description">
                <h3 className="lyrics-section-title">About This Track</h3>
                {lyricsTrack.description.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
              
              {/* Lyrics */}
              {lyricsTrack.lyrics && (
                <div className="lyrics-text">
                  <h3 className="lyrics-section-title">Lyrics</h3>
                  {lyricsTrack.lyrics.split('\n\n').map((verse, idx) => (
                    <div key={idx} className="lyrics-verse">
                      {verse.split('\n').map((line, lineIdx) => (
                        <p key={lineIdx} className="lyrics-line">{line}</p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Background Music Player */}
      <audio
        ref={bgMusicRef}
        src={BACKGROUND_MUSIC}
        loop
        preload="auto"
        onEnded={() => setBgMusicPlaying(false)}
        onError={(e) => console.error('Audio error:', e)}
      />
      <button
        className={`bg-music-btn ${bgMusicPlaying ? 'playing' : ''}`}
        onClick={async () => {
          if (bgMusicRef.current) {
            if (bgMusicPlaying) {
              bgMusicRef.current.pause();
              setBgMusicPlaying(false);
            } else {
              try {
                bgMusicRef.current.volume = 0.3;
                await bgMusicRef.current.play();
                setBgMusicPlaying(true);
              } catch (error) {
                console.error('Audio play failed:', error);
                setBgMusicPlaying(false);
              }
            }
          }
        }}
        data-testid="bg-music-btn"
        title={bgMusicPlaying ? 'Pause ambient music' : 'Play ambient music'}
      >
        {bgMusicPlaying ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        )}
        <span className="bg-music-label">{bgMusicPlaying ? 'Ambient' : 'Play'}</span>
      </button>

      <ChatWidget />
    </div>
  );
}

export default App;

# Fedired's ActivityPub extensions

These are the extensions to ActivityPub that Fedired implements. This page uses [compact IRIs](https://www.w3.org/TR/json-ld/#dfn-compact-iri). The `fedired` prefix is used to refer to `https://fedired.com/ns#`.

## speakAsCat

- Compact IRI: `fedired:speakAsCat`
- Canonical IRI: `https://fedired.com/ns#speakAsCat`

Used on actors to indicate that they not only identify as a cat, but also want to have their text be transformed to speak like one, expressed as a boolean value. If this property is set to true, displaying the actor’s posts will make them speak with “nya” instead of “na” and other cat-related text mannerisms. Used in combination with [misskey:isCat](https://misskey-hub.net/ns/#iscat).

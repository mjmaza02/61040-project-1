import AuthenticatingConcept from "./concepts/authenticating";
import FriendingConcept from "./concepts/friending";
import PostingConcept from "./concepts/posting";
import SessioningConcept from "./concepts/sessioning";
// New
import ListingConcept from "./concepts/listing";
import TrackingConcept from "./concepts/tracking";
import CheckingConcept from "./concepts/checking";

// The app is a composition of concepts instantiated here
// and synchronized together in `routes.ts`.
export const Sessioning = new SessioningConcept();
export const Authing = new AuthenticatingConcept("users");
export const Posting = new PostingConcept("posts");
export const Friending = new FriendingConcept("friends");
// New
export const Whitelisting = new ListingConcept("Whitelist");
export const Tracking = new TrackingConcept("Tracking");
export const Checking = new CheckingConcept("Checking");
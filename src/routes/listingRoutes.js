import express from 'express';
import { createListing, getListings, getListingById, deleteListing, updateListing, getMyListings, getRecommendations } from '../controllers/listingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .post(protect, createListing)
    .get(protect, getListings);

// Specific named routes must come BEFORE /:id to avoid being swallowed as dynamic params
router.get('/my', protect, getMyListings);
router.get('/recommendations', protect, getRecommendations);

router.route('/:id')
    .get(protect, getListingById)
    .put(protect, updateListing)
    .delete(protect, deleteListing);

export default router;

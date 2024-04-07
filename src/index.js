
import axios from 'axios';
import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

let lightbox = new SimpleLightbox('.gallery a', { fadeSpeed: 500 });
Notiflix.Notify.init({ width: "400px", fontSize: "20px", cssAnimationStyl: "zoom", position: "center-center" });

class imageSearcher {
  constructor({ form, btnLoadMore, gallery }, URI) {
    this.URI = URI;
    this.form = form;
    this.btnLoadMore = btnLoadMore;
    this.gallery = gallery;
    this.searchName = '';
    this.pageCounter = 1;
  }

  init() {
    this.addListeners();
  }

  addListeners() {
    this.form.addEventListener('submit', this.onSubmit.bind(this));
    this.btnLoadMore.addEventListener('click', () => {
      this.onSearchImage(this.searchName.trim());
    });
  }

  onSubmit(e) {
    e.preventDefault();

    this.searchName = e.target.elements.searchQuery.value;

    if (this.searchName === '') {
      this.onResetMarkup();
      Notiflix.Notify.info("Please, fill in the search field!");
      return;
    }
    this.onResetMarkup();

    this.onSearchImage(this.searchName.trim());
  }

  async fetchImages(name) {
    const query = `&q=${name}`;
    const URI = this.URI + this.pageCounter + query;

    const response = await axios.get(URI);
    return response.data;
  }

  onSearchImage(searchName) {
    this.fetchImages(searchName)
      .then(this.onResolve.bind(this))
      .catch(this.onReject.bind(this));
  }

  onResolve({ total, hits, totalHits }) {
    if (total === 0) {
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.');
      return;
    }

    const imageCounter = this.pageCounter * 40 - 40;

    if (totalHits - imageCounter > 0) {
      this.getImages(hits);

      Notiflix.Notify.info(`Hooray! We found ${totalHits} images.`);
      return;
    }
    this.stopSearch();
  }

  onReject({ response, message }) {
    if (response.status === 400) {
      this.stopSearch();
    }
    console.log(message);
  }
  getImages(hits) {
    this.makeImagesMarkup(hits);

    this.btnLoadMore.style.display = 'block';
    if (this.pageCounter > 1) {
      this.onPageScrolling();
    }
    this.pageCounter += 1;

    lightbox.refresh();
  }

  makeImagesMarkup(data) {
    const markup = data
      .map(item => {
        return this.createElement(item);
      })
      .join('');
    return this.gallery.insertAdjacentHTML("beforeend", markup);
  }

  createElement(item) {
    const {
      largeImageURL,
      webformatURL,
      tags,
      likes,
      views,
      comments,
      downloads,
    } = item;

    return `<div class="photo-card">
  <a class="photo-card__link" href="${largeImageURL}">
  <img class="photo-card__image" src="${webformatURL}" alt="${tags}" loading="lazy" />
  </a>
  <div class="info">
  <p class="info-item"><b>Likes</b><span>${likes}</span></p>
  <p class="info-item"><b>Views</b><span>${views}</span></p>
  <p class="info-item"><b>Comments</b><span>${comments}</span></p>
  <p class="info-item"><b>Downloads</b><span>${downloads}</span></p>
  </div>
  </div>`;
  }

  stopSearch() {
    Notiflix.Notify.failure(
      "We're sorry, but you've reached the end of search results.", { position: "center-bottom" }
    );
    this.btnLoadMore.style.display = 'none';
    this.gallery.style.marginBottom = 160 + 'px';
  }

  onResetMarkup() {
    this.pageCounter = 1;
    this.btnLoadMore.style.display = 'none';
    this.gallery.style.marginBottom = 0 + 'px';
    this.gallery.innerHTML = '';
  }

  onPageScrolling() {
    const { height: cardHeight } = document
      .querySelector('.gallery')
      .firstElementChild.getBoundingClientRect();

    window.scrollBy({
      top: cardHeight * 2,
      behavior: 'smooth',
    });
  }
}

const APIkey = '43180045-2a823b70ff34c573c104115ae';
const URI = `https://pixabay.com/api/?key=${APIkey}&image_type=photo&orientation=horizontal&safesearch=true&per_page=40&page=`;

const getRef = x => document.querySelector(x);

const refs = {
  form: getRef('#search-form'),
  btnLoadMore: getRef('.load-more'),
  gallery: getRef('.gallery'),
};

new imageSearcher(refs, URI).init();
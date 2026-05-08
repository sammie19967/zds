import { useEffect } from 'react';
import PropTypes from 'prop-types';

const SITE_NAME = 'Zane Driving School';
const SITE_URL = 'https://zanedrivingschool.co.ke';
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

const setMetaTag = (selector, attributes) => {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement('meta');
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value) {
      tag.setAttribute(key, value);
    }
  });
};

const setLinkTag = (selector, attributes) => {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement('link');
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value) {
      tag.setAttribute(key, value);
    }
  });
};

const Seo = ({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
  robots = 'index, follow'
}) => {
  useEffect(() => {
    const canonicalUrl = `${SITE_URL}${path}`;
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

    document.title = fullTitle;

    setMetaTag('meta[name="description"]', {
      name: 'description',
      content: description
    });

    setMetaTag('meta[name="robots"]', {
      name: 'robots',
      content: robots
    });

    setLinkTag('link[rel="canonical"]', {
      rel: 'canonical',
      href: canonicalUrl
    });

    setMetaTag('meta[property="og:type"]', {
      property: 'og:type',
      content: 'website'
    });

    setMetaTag('meta[property="og:site_name"]', {
      property: 'og:site_name',
      content: SITE_NAME
    });

    setMetaTag('meta[property="og:url"]', {
      property: 'og:url',
      content: canonicalUrl
    });

    setMetaTag('meta[property="og:title"]', {
      property: 'og:title',
      content: fullTitle
    });

    setMetaTag('meta[property="og:description"]', {
      property: 'og:description',
      content: description
    });

    setMetaTag('meta[property="og:image"]', {
      property: 'og:image',
      content: image
    });

    setMetaTag('meta[name="twitter:card"]', {
      name: 'twitter:card',
      content: 'summary_large_image'
    });

    setMetaTag('meta[name="twitter:title"]', {
      name: 'twitter:title',
      content: fullTitle
    });

    setMetaTag('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: description
    });

    setMetaTag('meta[name="twitter:image"]', {
      name: 'twitter:image',
      content: image
    });
  }, [description, image, path, robots, title]);

  return null;
};

Seo.propTypes = {
  description: PropTypes.string.isRequired,
  image: PropTypes.string,
  path: PropTypes.string,
  robots: PropTypes.string,
  title: PropTypes.string.isRequired
};

export default Seo;

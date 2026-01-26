import { Component, define } from "@kickstartds/core/lib/component";

export const identifier = "dsa.timeline";

class Timeline extends Component {
  constructor(element) {
    super(element);

    // Cache timeline items
    const items = Array.from(element.querySelectorAll(".dsa-timeline__item"));

    // Set up Intersection Observer for scroll animations
    const observerOptions = {
      root: null,
      rootMargin: "0px 0px -100px 0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("dsa-timeline__item--visible");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe each item
    items.forEach((item) => {
      item.classList.add("dsa-timeline__item--hidden");
      observer.observe(item);
    });

    // Set up parallax effect
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.pageYOffset;
          const elementTop = element.getBoundingClientRect().top + scrollY;

          items.forEach((item, index) => {
            const itemTop =
              item.getBoundingClientRect().top + scrollY - elementTop;
            const offset = (scrollY - elementTop - itemTop) * 0.05;
            const image = item.querySelector(".dsa-timeline__image");

            if (image) {
              image.style.transform = `translateY(${offset}px)`;
            }
          });

          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Cleanup
    this.onDisconnect(() => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    });
  }
}

define(identifier, Timeline);

import '../styles/StudentTestimonials.css';

const testimonials = [
  {
    name: 'Faith M.',
    course: 'Driving Lessons',
    quote:
      'Zane helped me build confidence on the road. The instructors are patient and explain everything clearly.',
    rating: 5
  },
  {
    name: 'Brian K.',
    course: 'Computer Packages',
    quote:
      'The computer training was practical and easy to follow. I gained skills I can use immediately.',
    rating: 5
  },
  {
    name: 'Cynthia W.',
    course: 'Refresher Course',
    quote:
      'I came back after years and I was nervous, but the refresher lessons got me ready again fast.',
    rating: 5
  }
];

const StudentTestimonials = () => {
  return (
    <section className="student-testimonials" aria-label="Student testimonials">
      <div className="student-testimonials__inner">
        <div className="student-testimonials__header">
          <h2>What Students Say</h2>
          <p>Real feedback from learners across driving and computer training.</p>
        </div>

        <div className="student-testimonials__grid">
          {testimonials.map((t) => (
            <article key={`${t.name}-${t.course}`} className="testimonial-card">
              <div className="testimonial-card__top">
                <div className="testimonial-card__rating" aria-label={`${t.rating} out of 5 stars`}>
                  {'★'.repeat(t.rating)}
                  <span className="testimonial-card__rating--empty">{'☆'.repeat(5 - t.rating)}</span>
                </div>
                <div className="testimonial-card__meta">
                  <div className="testimonial-card__name">{t.name}</div>
                  <div className="testimonial-card__course">{t.course}</div>
                </div>
              </div>

              <p className="testimonial-card__quote">“{t.quote}”</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StudentTestimonials;

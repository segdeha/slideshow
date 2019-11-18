/* slideshow 0.1
   Copyright 2019 Andrew Hedges, andrew@hedges.name
*/

class Slideshow {
    constructor(options) {
        this.idx = this.getSlideFromHash() - 1
        this.setHash(this.idx + 1)
        this.selector = options.selector || '#slideshow > section'
        this.slideData = options.slideData || []
        this.initSlides()
        this.updateCount()
        // no point in making navigation work if there are fewer than 2 slides
        if (this.slideData.length > 1) {
            if ('ontouchstart' in window) {
                this.addTouchEvents()
            }
            else {
                this.addKeyEvents()
            }
        }
    }

    addKeyEvents() {
        document.addEventListener('keyup', evt => {
            // prevent arrow keys from moving the document slightly in some cases
            evt.preventDefault()
            // left
            if (37 === evt.keyCode) {
                this.prev()
            }
            // right
            else if (39 === evt.keyCode) {
                this.next()
            }
            // s (for "slide")
            else if (83 === evt.keyCode) {
                let slide = prompt('Enter the slide number')
                if (/\d+/.test(slide)) {
                    if (slide > -1 && slide < this.slideData.length) {
                        this.jumpToSlide(slide)
                    }
                }
            }
        })
    }

    addTouchEvents() {
        let x_start, y_start, x_last, y_last

        document.addEventListener('touchstart', evt => {
            // capture starting drag position
            x_start = x_last = evt.touches[0].pageX
            y_start = y_last = evt.touches[0].pageY
        })

        document.addEventListener('touchmove', evt => {
            // capture current drag position
            x_last = evt.touches[0].pageX
            y_last = evt.touches[0].pageY
        })

        document.addEventListener('touchend', evt => {
            let x_diff, y_diff

            // calculate the difference between the start and end drag positions
            x_diff = x_last - x_start
            y_diff = y_last - y_start

            // only respond to horizontal drags
            if (Math.abs(x_diff) > Math.abs(y_diff)) {
                // only act on drags greater than 30px
                if (x_diff > 30) {
                    this.prev()
                }
                else if (x_diff < -30) {
                    this.next()
                }
            }
        })
    }

    // hash should contain the slide number
    // gets returned as the slideData array index
    getSlideFromHash() {
        let hash = window.location.hash.replace('#', '')
        if (hash.length > 0 && /^\d*$/.test(hash)) {
            return +hash
        }
        else {
            return 1
        }
    }

    setHash(slide) {
        window.location.hash = slide
    }

    jumpToSlide(slide = 1) {
        this.setHash(slide)
        window.location.reload()
    }

    // create initial set of 3 slides
    // if starting at the beginning of the show, create a blank, dummy slide for the hidden slide
    initSlides() {
        let html = ''
        html += this.makeSlide(this.slideData[this.idx + 1])
        html += this.makeSlide(this.slideData[this.idx])
        if (this.idx > 0) {
            html += this.makeSlide(this.slideData[this.idx - 1], 'hidden')
        }
        else {
            html += '<section class="hidden"></section>'
        }
        document.getElementById('slideshow').innerHTML = html
    }

    next() {
        ++this.idx
        if (this.idx > this.slideData.length - 1) {
            this.idx = 0
        }
        this.setHash(this.idx + 1)
        let slides = this.grabSlides()
        let topIdx = slides.length - 1
        let currentIdx = slides.length - 2
        let bottomIdx = 0
        let nextIdx = this.idx + 1
        if (nextIdx > this.slideData.length - 1) {
            nextIdx = 0
        }
        // transition out current slide
        slides[currentIdx].classList.add('hidden')
        setTimeout(() => {
            slides[currentIdx].style.display = 'none'
        }, 1000)
        // remove last slide
        slides[topIdx].remove()
        // make HTML for new slide
        let html = this.makeSlide(this.slideData[nextIdx])
        // insert new slide at the top of the container (before the now visible slide)
        slides[bottomIdx].insertAdjacentHTML('beforebegin', html)
        this.updateCount()
    }

    prev() {
        --this.idx
        if (this.idx < 0) {
            this.idx = this.slideData.length - 1
        }
        this.setHash(this.idx + 1)
        let slides = this.grabSlides()
        let topIdx = slides.length - 1
        let currentIdx = slides.length - 2
        let bottomIdx = 0
        let prevIdx = this.idx - 1
        if (prevIdx < 0) {
            prevIdx = this.slideData.length - 1
        }
        // transition in hidden slide
        slides[topIdx].style.cssText = 'block'
        // slides[2].style.cssText = ''
        slides[topIdx].classList.remove('hidden')
        // remove first slide
        slides[bottomIdx].remove()
        // make HTML for new slide
        let html = this.makeSlide(this.slideData[prevIdx], 'hidden', 'display: none;')
        // insert new slide at the bottom of the container (after the now visible slide)
        slides[topIdx].insertAdjacentHTML('afterend', html)
        this.updateCount()
    }

    updateCount() {
        let html = `${this.idx + 1}/${this.slideData.length}`
        document.getElementById('count').innerHTML = html
    }

    grabSlides() {
        let slides = document.querySelectorAll(this.selector)
        // error if there are not 3 slides present
        if (!slides || slides.length < 2) {
            throw 'Error: Slideshow requires 3 existing slides';
        }
        return slides
    }

    makeSlide(slide, className, style) {
        let type, html, el
        if (slide.url && slide.h1 && slide.h2) {
            type = 'Title'
        }
        else if (slide.src) {
            type = 'Image'
        }
        else if (slide.video) {
            type = 'Video'
        }
        else {
            console.warn('No match', slide)
            return
        }
        html = this[`make${type}Slide`](slide, className, style)
        return html
    }

    makeTitleSlide(slide, className = '', style = '') {
        let { url, h1, h2 } = slide
        let html = `
            <section class="rotate ${className}" style="${style}">
                <article>
                    <figure class="title" style="background-image: url('./assets/srcs/${url}');"></figure>
                    <header>
                        <h1>${h1}</h1>
                        <h2>${h2}</h2>
                    </header>
                </article>
            </section>
        `
        return html
    }

    makeImageSlide(slide, className = '', style = '') {
        let { src } = slide
        let html = `
            <section class="${className}" style="${style}">
                <article>
                    <figure>
                        <img src="./assets/srcs/${src}" alt="">
                    </figure>
                </article>
            </section>
        `
        return html
    }

    makeVideoSlide(slide, className = '', style = '') {
        let { video } = slide
        let html = `
            <section class="${className}" style="${style}">
                <article>
                    <figure>
                        <video controls preload="auto" type="video/mp4" src="./assets/srcs/${video}"></video>
                    </figure>
                </article>
            </section>
        `
        return html
    }
}

function initSlideshow(slideData = []) {
    const ss = new Slideshow({
        slideData,
        selector: '#slideshow > section'
    })
}

export default initSlideshow

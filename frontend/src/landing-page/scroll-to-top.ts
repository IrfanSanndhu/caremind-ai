export function scrollToPageTop(behavior: ScrollBehavior = 'smooth'): void {
  window.scrollTo({ top: 0, left: 0, behavior });
}

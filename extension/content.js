// Entry point — initialize on page load

if (document.readyState === 'complete') {
    handlePageChange();
} else {
    window.addEventListener('load', handlePageChange);
}

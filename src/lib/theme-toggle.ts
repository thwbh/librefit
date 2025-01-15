export const observeToggle = (element: Node, callback: (arg0: Node) => void) => {
	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
				callback(mutation.target);
			}
		});
	});
	observer.observe(element, { attributes: true });
	return observer.disconnect;
};

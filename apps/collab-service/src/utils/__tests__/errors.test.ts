describe('Dummy Test Suite', () => {
    it('should pass a basic assertion', () => {
        expect(1 + 1).toBe(2);
    });

    it('should verify true is true', () => {
        expect(true).toBe(true);
    });

    it('should check string equality', () => {
        const greeting = 'Hello, World!';
        expect(greeting).toBe('Hello, World!');
    });
});

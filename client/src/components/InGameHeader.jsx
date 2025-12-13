export function InGameHeader({ currentTitle, target }) {
    return (
        <div >
            <h2 >Current: {currentTitle}</h2>
            <div >Target: {target}</div>
        </div>
    )
}
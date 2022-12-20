const payBtn = document.querySelector("#btn-check-3")

payBtn.addEventListener("click", () => {

    console.log("click")

    fetch("http://localhost:3000/api/subscription-payment", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            items: [
                { id: 1, quantity: 1 },
            ],
        }),
    })

    // If everything is successfull, a response is returned that is convert into json by us
    .then(res => {
        if (res.ok) return res.json()
        return res.json().then(json => Promise.reject(json))    // Rejecting the JSON promise response
    })
        // This is the actual json response as per the requirement which contains a unique stripe url 
        .then(({ url }) => {
            window.location = url;
        })

    // Something went wrong
    .catch(e => {
        console.error(e.error)
    })
})
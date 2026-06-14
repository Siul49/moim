fetch("https://api.github.com/repos/Siul49/moim/pulls?state=open")
  .then((r) => r.json())
  .then((d) => {
    const pr = d[0];
    if (!pr) {
      console.log("No PRs found");
      return;
    }
    console.log("PR: " + pr.number);
    fetch(
      "https://api.github.com/repos/Siul49/moim/issues/" +
        pr.number +
        "/comments",
    )
      .then((r) => r.json())
      .then((comments) => {
        console.log("COMMENTS:", comments.map((c) => c.body).join("\n---\n"));
      });
    fetch(
      "https://api.github.com/repos/Siul49/moim/pulls/" +
        pr.number +
        "/reviews",
    )
      .then((r) => r.json())
      .then((reviews) => {
        console.log("REVIEWS:", reviews.map((c) => c.body).join("\n---\n"));
      });
  });

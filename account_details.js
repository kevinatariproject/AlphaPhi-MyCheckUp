// Small enhancement: allow toggling the active item (purely visual in this static mock)
      document.querySelectorAll(".sidenav .nav").forEach((btn) => {
        btn.addEventListener("click", () => {
          document
            .querySelectorAll(".sidenav .nav")
            .forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
        });
      });

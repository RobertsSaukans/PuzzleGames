document.addEventListener('DOMContentLoaded', function () {
    var readmorebtn = document.getElementById('readmore');
    var readmorebtn2 = document.getElementById('readmore2');
    var infodiv = document.getElementById('info');
    var infodiv2 = document.getElementById('info2');

    // Toggle funkcijas wrappers — rāda/slēpj blokus ar aprakstiem
    function readmoreButton () {
        toggleVisibilityBlock(infodiv);
    }

    function readmoreButton2 () {
        toggleVisibilityBlock(infodiv2);
    }

    // Toggle redzamību: ja tukšs vai 'none' — rāda, citādi slēpj
    function toggleVisibilityBlock(element) {
        if (element.style.display === 'none' || element.style.display === '') {
            element.style.display = 'block';
        } else {
            element.style.display = 'none';
        }
    }

    // Pievieno event listenerus pogām
    readmorebtn.addEventListener('click', function () { readmoreButton(); }); 
    readmorebtn2.addEventListener('click', function () { readmoreButton2(); }); 
});
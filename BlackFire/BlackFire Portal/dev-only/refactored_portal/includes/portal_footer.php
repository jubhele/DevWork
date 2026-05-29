<?php
// Find portal root regardless of depth (deployed: portal_root/includes/ · local: dev-only/refactored_portal/includes/)
$_bhk_root = __DIR__;
while (!is_file($_bhk_root . '/config/config.php') && dirname($_bhk_root) !== $_bhk_root) {
    $_bhk_root = dirname($_bhk_root);
}
?>
<script src="js/portal_api.js?v=<?= filemtime($_bhk_root.'/js/portal_api.js') ?>"></script>
<script src="js/portal_state.js"></script>
<script src="js/portal_main.js?v=<?= filemtime($_bhk_root.'/js/portal_main.js') ?>"></script>
</body>
</html>

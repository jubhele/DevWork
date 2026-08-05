<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Umlilo Portal - Test View</title>
    
    <style>
        /* Embedded CSS to bypass any external stylesheet caching */
        body { 
            margin: 0; 
            font-family: Arial, sans-serif; 
            background-color: #f4f6f9; 
        }
        
        .top-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 0 30px; 
            height: 70px; 
            background-color: #ffffff; 
            border-bottom: 1px solid #ddd; 
            position: fixed; 
            top: 0; 
            width: 100%; 
            box-sizing: border-box; 
            z-index: 1001; 
        }
        
        .logo { 
            font-weight: bold; 
            font-size: 20px; 
            color: #ff5722; 
        }
        
        .public-nav a { 
            text-decoration: none; 
            color: #333; 
            margin: 0 15px; 
            font-size: 14px; 
        }
        
        /* The Vertical, Floating, Scrollable Menu */
        .sidebar-menu { 
            position: fixed; 
            top: 70px; 
            left: 0; 
            width: 250px; 
            height: calc(100vh - 70px); 
            overflow-y: auto; 
            background-color: #ffffff; 
            border-right: 1px solid #ddd; 
            display: flex; 
            flex-direction: column; 
            padding: 10px 0; 
            z-index: 1000; 
        }
        
        .sidebar-menu a { 
            text-decoration: none; 
            color: #555; 
            padding: 15px 30px; 
            font-size: 14px; 
            border-bottom: 1px solid #eee; 
            font-weight: bold;
        }
        
        .sidebar-menu a:hover { 
            color: #ff5722; 
            background-color: #fdf5f2; 
        }
        
        .main-content { 
            margin-top: 70px; 
            margin-left: 250px; 
            padding: 40px; 
        }
    </style>
</head>
<body>
    
    <header class="top-header">
        <div class="logo">Umlilo Portal Test</div>
        <nav class="public-nav">
            <a href="/index.php">Home</a>
            <a href="/services.php">Services</a>
            <a href="/contact.php">Contact</a>
        </nav>
    </header>

    <aside class="sidebar-menu">
        <a href="#dashboard">DASHBOARD</a>
        <a href="#callouts">CALLOUTS</a>
        <a href="#timeline">TIMELINE</a>
        <a href="#transactions">TRANSACTIONS</a>
        <a href="#invoices">INVOICES</a>
        <a href="#quotes">QUOTES</a>
        <a href="#test1">TEST LINK 1</a>
        <a href="#test2">TEST LINK 2</a>
        <a href="#test3">TEST LINK 3</a>
        <a href="#test4">TEST LINK 4</a>
        <a href="#test5">TEST LINK 5</a>
        <a href="#test6">TEST LINK 6</a>
        <a href="#test7">TEST LINK 7</a>
        <a href="#test8">TEST LINK 8</a>
    </aside>

    <main class="main-content">
        <h1>Umlilo Portal Testing Ground</h1>
        <p>If you are seeing this text and the menu is floating on the left side, the upload was successful and your browser is loading the correct file.</p>
    </main>
    
</body>
</html>

import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Copy, Check, ExternalLink, Code2, Server, Database, ArrowRight } from "lucide-react";
import { useState } from "react";

const CodeBlock = ({ title, code, language = "bash" }: { title: string; code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs leading-relaxed text-foreground/90">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const StepCard = ({ step, title, icon: Icon, children }: { step: number; title: string; icon: any; children: React.ReactNode }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
        {step}
      </div>
      <Icon className="h-5 w-5 text-primary shrink-0" />
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
    </div>
    <div className="ml-11 space-y-3">{children}</div>
  </div>
);

const ApiDocs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pb-16 md:pb-0">
        {/* Header */}
        <div className="bg-green-bar px-4 py-3">
          <h1 className="font-display text-sm font-bold uppercase tracking-wider text-primary-foreground flex items-center gap-2">
            <Code2 className="h-4 w-4" /> API Integration Guide
          </h1>
        </div>

        <div className="max-w-4xl mx-auto p-4 space-y-8">
          {/* Intro */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-foreground leading-relaxed">
              Follow these steps to integrate casino games into your platform. You'll need an <strong>Agent ID</strong>, <strong>Agent Key</strong>, and a <strong>Callback URL</strong> hosted on your server.
            </p>
          </div>

          {/* Step 1 */}
          <StepCard step={1} title="Game Launch URL" icon={ExternalLink}>
            <p className="text-sm text-muted-foreground">Redirect players from your website to the game using this URL:</p>
            <CodeBlock title="GET Request" code={`GET https://betapi.space/v1001/beta
  ?agentid=GD007
  &agentkey=YOUR_SECRET_KEY
  &userid=PLAYER_ID
  &gameid=GAME_UID
  &callbackurl=YOUR_CALLBACK_URL
  &currency=INR`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { param: "agentid", desc: "Your unique agent ID" },
                { param: "agentkey", desc: "Your secret API key" },
                { param: "userid", desc: "Unique player identifier" },
                { param: "gameid", desc: "Game UID from the game list" },
                { param: "callbackurl", desc: "Your server callback URL" },
                { param: "currency", desc: "Currency code (INR, USD, etc.)" },
              ].map((p) => (
                <div key={p.param} className="flex gap-2 rounded bg-muted/30 p-2">
                  <code className="text-primary font-semibold">{p.param}</code>
                  <span className="text-muted-foreground">{p.desc}</span>
                </div>
              ))}
            </div>
          </StepCard>

          {/* Step 2 */}
          <StepCard step={2} title="Create Your Callback URL" icon={Server}>
            <p className="text-sm text-muted-foreground">Your callback URL must handle 2 tasks:</p>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground">A. Balance Check (GET Request)</h3>
              <CodeBlock title="Request" code={`GET https://your-callback.com?action=get_balance&userid=player123`} />
              <CodeBlock title="Response" code={`{ "balance": "1500.00" }`} language="json" />
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground">B. Bet/Win Update (POST Request)</h3>
              <CodeBlock title="POST Body" code={`{
  "user_id": "player123",
  "bet_amount": 100,
  "win_amount": 250,
  "game_name": "Fortune Tiger",
  "provider": "PGSoft"
}`} language="json" />
              <CodeBlock title="Response" code={`{ "code": 0, "balance": "1650.00" }`} language="json" />
            </div>
          </StepCard>

          {/* Step 3 */}
          <StepCard step={3} title="Sample Callback (PHP)" icon={Code2}>
            <p className="text-sm text-muted-foreground">Upload this PHP file to your cPanel/VPS. Update DB credentials.</p>
            <CodeBlock title="callback.php" code={`<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// DATABASE CREDENTIALS
$db_host = "localhost";
$db_user = "YOUR_DB_USER";
$db_pass = "YOUR_DB_PASS";
$db_name = "YOUR_DB_NAME";

$db = new mysqli($db_host, $db_user, $db_pass, $db_name);
if ($db->connect_error) {
    echo json_encode(["code" => 1, "msg" => "DB connection failed"]);
    exit;
}

// BALANCE CHECK
if (isset($_GET['action']) && $_GET['action'] === 'get_balance') {
    $user_id = $db->real_escape_string($_GET['userid'] ?? '');
    if (empty($user_id)) {
        echo json_encode(["code" => 1, "msg" => "Missing userid"]);
        exit;
    }
    $result = $db->query("SELECT balance FROM players WHERE user_id = '$user_id'");
    if ($result->num_rows === 0) {
        echo json_encode(["code" => 1, "msg" => "Player not found"]);
        exit;
    }
    $row = $result->fetch_assoc();
    echo json_encode(["balance" => number_format((float)$row['balance'], 2, '.', '')]);
    exit;
}

// BET/WIN UPDATE
$data = json_decode(file_get_contents('php://input'), true);
if (!$data || !isset($data['user_id'])) {
    echo json_encode(["code" => 1, "msg" => "Invalid request"]);
    exit;
}

$user_id    = $db->real_escape_string($data['user_id']);
$bet_amount = (float)($data['bet_amount'] ?? 0);
$win_amount = (float)($data['win_amount'] ?? 0);
$net_amount = $win_amount - $bet_amount;

$result = $db->query("SELECT balance FROM players WHERE user_id = '$user_id'");
if ($result->num_rows === 0) {
    echo json_encode(["code" => 1, "msg" => "Player not found"]);
    exit;
}

$balance = (float)$result->fetch_assoc()['balance'];
if ($net_amount < 0 && $balance < abs($net_amount)) {
    echo json_encode(["code" => 1, "msg" => "Insufficient balance"]);
    exit;
}

$db->query("UPDATE players SET balance = balance + ($net_amount) WHERE user_id = '$user_id'");
$result = $db->query("SELECT balance FROM players WHERE user_id = '$user_id'");
$new_balance = (float)$result->fetch_assoc()['balance'];

echo json_encode(["code" => 0, "balance" => number_format($new_balance, 2, '.', '')]);
$db->close();
?>`} />
          </StepCard>

          {/* Step 4 */}
          <StepCard step={4} title="Players Table (MySQL)" icon={Database}>
            <CodeBlock title="SQL" code={`CREATE TABLE players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO players (user_id, balance) VALUES ('player123', 5000.00);`} language="sql" />
          </StepCard>

          {/* Flow */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">🔄 Complete Flow</h2>
            <div className="space-y-2">
              {[
                "Player clicks a game on your website",
                "Your site calls betapi.space with agent credentials + callback URL",
                "Game engine checks player balance via your callback",
                "Game engine calls Game API → receives Game URL",
                "Player plays the game (bet/win)",
                "Game API calls game engine callback",
                "Engine calculates GGR, deducts, forwards to your callback",
                "Your callback updates balance → returns new balance",
                "Engine sends new balance back to Game API",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-foreground/80">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default ApiDocs;
